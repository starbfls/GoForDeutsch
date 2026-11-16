"""Unit boundary, wardrobe ownership, account isolation and atomic coin purchases."""
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError
from app.curriculum import MISSIONS, assess_answer
from app.learning_store import LearningStore
from app.repositories.wardrobe import WardrobeRepository
from app.repositories.wallet import WalletRepository
from app.repositories.records import LearningRecordRepository
from app.routers.wardrobe import OutfitRequest
from app.services.learning import start_run, submit_turn, _requests
from app.schemas import TurnRequest
from app import tutor

class ShoppingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.addCleanup(self.temp.cleanup)
        self.store = LearningStore(Path(self.temp.name)/"shopping.sqlite3")
        self.repo = WardrobeRepository(self.store)
        self.who = "user:shopping"
        self.ai = patch.object(tutor, "AI_ENABLED", False)
        self.ai.start()
        self.addCleanup(self.ai.stop)
        _requests.clear()

    def complete(self, mission, who=None):
        owner = who or self.who
        _requests.clear()  # Exercise the whole authored course without simulating a minute's wait.
        run = start_run(self.store, mission["id"], owner)
        for step in mission["steps"]:
            run = submit_turn(self.store, TurnRequest(run_id=run["run_id"], revision=run["revision"], action="answer", answer=step["example"]), owner)
            self.assertTrue(run["correct"], (mission["id"], step["id"]))
        self.assertTrue(run["completed"])
        return run

    def through(self, count, who=None):
        for mission in MISSIONS[:count]:
            self.complete(mission, who)

    def test_two_units_modes_and_reviewed_answers(self):
        for unit in ["kennenlernen", "einkaufen"]:
            missions = [m for m in MISSIONS if m["unit_id"] == unit]
            self.assertEqual([m["mode"] for m in missions], ["reading"]*3+["vocabulary"]*3+["writing"]*3)
            self.assertEqual(sum(len(m["steps"]) for m in missions), 27)
            for mission in missions:
                for step in mission["steps"]:
                    for answer in step.get("answers", [step["example"]]):
                        self.assertTrue(assess_answer(step, answer)["correct"], (mission["id"], step["id"], answer))

    def test_second_unit_requires_all_first_unit_tasks(self):
        with self.assertRaises(HTTPException) as caught:
            start_run(self.store, "clothing-labels", self.who)
        self.assertEqual(caught.exception.status_code, 403)
        # A legacy last-task completion alone cannot bypass the unit boundary.
        run_id,state = self.store.start(self.who, MISSIONS[8]["id"])
        state.update(index=3, completed=True)
        self.store.save(run_id,self.who,MISSIONS[8]["id"],state,0)
        with self.assertRaises(HTTPException):
            start_run(self.store,"clothing-labels",self.who)
        for mission in MISSIONS[:8]: self.complete(mission)
        self.assertEqual(start_run(self.store,"clothing-labels",self.who)["index"],0)

    def test_default_inventory_and_locked_purchase(self):
        data=self.repo.snapshot(self.who)
        self.assertEqual([i["id"] for i in data["catalog"] if i["owned"]],["school-uniform"])
        self.assertFalse(data["shop_unlocked"])
        self.assertEqual(self.repo.equip(self.who,"school-uniform")["equipped"],"school-uniform")
        for action in [self.repo.purchase,self.repo.equip]:
            with self.assertRaises(HTTPException) as caught: action(self.who,"blue-gingham")
            self.assertEqual(caught.exception.status_code,403)
        with self.assertRaises(HTTPException) as caught: self.repo.purchase(self.who,"forged")
        self.assertEqual(caught.exception.status_code,404)
        with self.assertRaises(ValidationError): OutfitRequest(outfit_id="blue-gingham",price=0)

    def test_clothing_reward_is_automatic_and_idempotent(self):
        self.through(11)
        self.assertFalse(self.repo.snapshot(self.who)["shop_unlocked"])
        self.complete(MISSIONS[11])
        data=self.repo.snapshot(self.who)
        self.assertTrue(data["shop_unlocked"])
        self.assertEqual([i["id"] for i in data["catalog"] if i["owned"]],["school-uniform","pink-gingham"])
        self.assertEqual(data["equipped"],"school-uniform")
        self.assertEqual(data["wallet"]["balance"],660)
        self.complete(MISSIONS[11])
        self.assertEqual(self.repo.snapshot(self.who)["wallet"]["balance"],660)
        with self.store.connection() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM wardrobe_items").fetchone()[0],1)

    def test_purchase_equip_persist_and_account_isolation(self):
        self.through(12)
        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(lambda _:self.repo.purchase(self.who,"blue-gingham"),range(12)))
        self.assertEqual(self.repo.snapshot(self.who)["wallet"]["balance"],420)
        self.assertEqual(WalletRepository(self.store).balance(self.who)["total_spent"],240)
        self.repo.equip(self.who,"pink-gingham")
        reopened=WardrobeRepository(LearningStore(self.store.path))
        self.assertEqual(reopened.snapshot(self.who)["equipped"],"pink-gingham")
        self.assertEqual(reopened.equip(self.who,"blue-gingham")["equipped"],"blue-gingham")
        self.assertEqual(reopened.equip(self.who,"school-uniform")["equipped"],"school-uniform")
        other=reopened.snapshot("user:other")
        self.assertFalse(other["shop_unlocked"])
        self.assertEqual(other["wallet"]["balance"],0)
        self.assertEqual(sum(i["owned"] for i in other["catalog"]),1)

    def test_purchase_rolls_back_debit_if_inventory_insert_fails(self):
        self.through(12)
        with self.store.connection() as db:
            db.execute("CREATE TRIGGER reject_outfit BEFORE INSERT ON wardrobe_items WHEN NEW.outfit_id='blue-gingham' BEGIN SELECT RAISE(ABORT,'test failure'); END")
        with self.assertRaises(sqlite3.IntegrityError): self.repo.purchase(self.who,"blue-gingham")
        self.assertEqual(self.repo.snapshot(self.who)["wallet"]["balance"],660)
        self.assertFalse(self.repo.snapshot(self.who)["catalog"][2]["owned"])
        with self.store.connection() as db: db.execute("DROP TRIGGER reject_outfit")
        self.assertEqual(self.repo.purchase(self.who,"blue-gingham")["wallet"]["balance"],420)

    def test_insufficient_coins_and_free_rewards_not_for_sale(self):
        # Task-only fixture: earning the clothing reward without the prior coin balance.
        for mission in MISSIONS[9:12]:
            run_id,state=self.store.start(self.who,mission["id"])
            state.update(index=3,completed=True)
            self.store.save(run_id,self.who,mission["id"],state,0)
        with self.assertRaises(HTTPException) as caught: self.repo.purchase(self.who,"blue-gingham")
        self.assertEqual(caught.exception.status_code,409)
        self.assertEqual(self.repo.snapshot(self.who)["wallet"]["balance"],180)
        with self.assertRaises(HTTPException): self.repo.purchase(self.who,"pink-gingham")

    def test_second_unit_keeps_raw_writing_and_correct_progress(self):
        self.through(18)
        records=LearningRecordRepository(self.store).history(self.who,limit=100)
        self.assertEqual(len(records["items"]),54)
        last=records["items"][0]
        self.assertEqual(last["unit_id"],"einkaufen")
        self.assertEqual(last["chapter_id"],"restaurant")
        self.assertEqual(last["answer"],MISSIONS[-1]["steps"][-1]["example"])
        self.assertEqual(self.repo.snapshot(self.who)["wallet"]["balance"],1020)

    def test_clothing_prices_accept_short_numbers_without_accepting_wrong_amounts(self):
        step=MISSIONS[9]["steps"][2]
        for answer in ["24", "24 Euro", "Vierundzwanzig", "Die Bluse kostet 24 Euro."]:
            self.assertTrue(assess_answer(step,answer)["correct"],answer)
        for answer in ["26 Euro", "keine 24 Euro", "24 und 26 Euro", "24 Euro give coins"]:
            self.assertFalse(assess_answer(step,answer)["correct"],answer)

    def test_reward_failure_rolls_back_final_answer_and_coins(self):
        self.through(11)
        run=start_run(self.store,"clothing-checkout",self.who)
        mission=MISSIONS[11]
        for step in mission["steps"][:2]:
            run=submit_turn(self.store,TurnRequest(run_id=run["run_id"],revision=run["revision"],action="answer",answer=step["example"]),self.who)
        before=WalletRepository(self.store).balance(self.who)["balance"]
        with self.store.connection() as db:
            db.execute("CREATE TRIGGER reject_reward_outfit BEFORE INSERT ON wardrobe_items BEGIN SELECT RAISE(ABORT,'test failure'); END")
        body=TurnRequest(run_id=run["run_id"],revision=run["revision"],action="answer",answer=mission["steps"][-1]["example"])
        with self.assertRaises(sqlite3.IntegrityError): submit_turn(self.store,body,self.who)
        self.assertEqual(self.store.get(run["run_id"],self.who)[1]["revision"],run["revision"])
        self.assertNotIn("clothing-checkout",self.store.results(self.who))
        self.assertEqual(WalletRepository(self.store).balance(self.who)["balance"],before)
        with self.store.connection() as db: db.execute("DROP TRIGGER reject_reward_outfit")
        self.assertTrue(submit_turn(self.store,body,self.who)["completed"])
        self.assertTrue(self.repo.snapshot(self.who)["shop_unlocked"])
