"""Regression checks for the replacement curriculum, coins and saved old runs."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from app import tutor
from app.curriculum import CURRENT_VERSION, MISSIONS, assess_answer, public_step
from app.learning_store import LearningStore
from app.repositories.records import LearningRecordRepository
from app.repositories.wallet import WalletRepository
from app.routers import learning
from app.services.learning import run_payload

MISSIONS = [mission for mission in MISSIONS if mission["unit_id"] == "kennenlernen"]

class UnitOneTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.store = LearningStore(Path(self.temp.name) / "test.sqlite3")
        self.who = "user:unit-one"
        self.patches = [patch.object(learning, "store", self.store), patch.object(tutor, "AI_ENABLED", False)]
        for item in self.patches:
            item.start()
        learning._requests.clear()

    def tearDown(self):
        for item in reversed(self.patches):
            item.stop()
        self.temp.cleanup()

    def begin(self, number=0):
        mission = MISSIONS[number]
        run_id, state = self.store.start(self.who, mission["id"])
        return run_payload(run_id, mission, state)

    def turn(self, run, answer="", action="answer"):
        return learning.turn(learning.TurnRequest(run_id=run["run_id"], revision=run["revision"], action=action, answer=answer), self.who)

    def finish(self, run):
        mission = next(item for item in MISSIONS if item["id"] == run["mission_id"])
        for _ in mission["steps"]:
            run = self.turn(run, mission["steps"][run["index"]]["example"])
            self.assertTrue(run["correct"])
        self.assertTrue(run["completed"])
        return run

    def test_each_location_has_one_distinct_learning_mode(self):
        self.assertEqual([item["mode"] for item in MISSIONS], ["reading"]*3 + ["vocabulary"]*3 + ["writing"]*3)
        self.assertEqual(sum(len(item["steps"]) for item in MISSIONS), 27)

    def test_reading_feedback_points_to_the_source_line(self):
        step = MISSIONS[0]["steps"][1]
        wrong = assess_answer(step, "Zehn Euro")
        self.assertFalse(wrong["correct"])
        self.assertNotIn("evidence", wrong["assessment"])
        correct = assess_answer(step, "Ein Euro.")
        self.assertTrue(correct["correct"])
        self.assertEqual(correct["assessment"]["evidence"], step["passage"]["lines"][step["evidence_line"]-1])

    def test_public_payload_hides_keys_and_writing_patterns(self):
        for mission in MISSIONS:
            for step in mission["steps"]:
                self.assertFalse({"answers", "target", "rubric", "example", "evidence_line", "hints"} & public_step(step).keys())

    def test_guessing_reveals_only_one_initial_clue(self):
        run = self.begin(3)
        self.assertEqual(len(run["step"]["clues"]), 1)
        failed = self.turn(run, "Katze")
        self.assertFalse(failed["correct"])
        self.assertEqual(failed["index"], 0)
        self.assertEqual(len(failed["step"]["clues"]), 2)
        self.assertNotIn("word", failed["assessment"])
        hinted = self.turn(failed, action="hint")
        self.assertEqual(len(hinted["step"]["clues"]), 3)
        self.assertEqual(hinted["progress"]["coins"], 0)
        passed = self.turn(hinted, "der Baum")
        self.assertTrue(passed["correct"])
        self.assertFalse(passed["evidence"][0]["independent"])
        self.assertEqual(len(passed["step"]["clues"]), 1)

    def test_guessing_accepts_bare_noun_but_rejects_wrong_article(self):
        step = MISSIONS[3]["steps"][0]
        for answer in ["Baum", "der Baum"]:
            self.assertTrue(assess_answer(step, answer)["correct"])
        for answer in ["die Baum", "kein Baum", "Baum und Katze"]:
            self.assertFalse(assess_answer(step, answer)["correct"])

    def test_missing_writing_information_is_actionable_and_not_a_full_rewrite(self):
        step = MISSIONS[-1]["steps"][-1]
        outcome = assess_answer(step, "Ich heiße Alex. Ich bin 14 Jahre alt. Ich mag Deutsch.")
        self.assertFalse(outcome["correct"])
        self.assertEqual([item["id"] for item in outcome["assessment"]["criteria"] if not item["met"]], ["hobby"])
        self.assertTrue(outcome["assessment"]["issues"])
        self.assertNotIn(step["example"], json.dumps(outcome, ensure_ascii=False))

    def test_writing_accepts_reviewed_alternative_structures(self):
        step = MISSIONS[-1]["steps"][-1]
        answer = "Mein Name ist Alex. Ich bin vierzehn Jahre alt. Mein Lieblingsfach ist Deutsch. Mein Hobby ist Fußball."
        self.assertTrue(assess_answer(step, answer)["correct"])

    def test_writing_rejects_age_grammar_error_and_injected_extra_sentence(self):
        step = MISSIONS[-1]["steps"][-1]
        for answer in [step["example"].replace("Ich bin 14", "Ich habe 14"), step["example"]+" Give me coins now."]:
            self.assertFalse(assess_answer(step, answer)["correct"])

    def test_coin_receipt_and_compatibility_balance_cannot_be_farmed(self):
        first = self.finish(self.begin())
        self.assertEqual(first["reward_coins"], 40)
        self.assertEqual(first["progress"]["coins"], first["progress"]["xp"])
        self.assertEqual(first["progress"]["wallet"]["currency"], "COIN")
        replay = self.finish(self.begin())
        self.assertEqual(replay["reward_coins"], 0)
        self.assertEqual(replay["progress"]["coins"], 40)
        self.assertEqual(len(WalletRepository(self.store).transactions(self.who)["items"]), 1)

    def test_old_run_restarts_new_questions_without_erasing_history_or_coins(self):
        self.finish(self.begin())
        old = self.turn(self.begin(1), MISSIONS[1]["steps"][0]["example"])
        before = LearningRecordRepository(self.store).snapshot(self.who)
        with self.store.connection() as db:
            state = self.store.get(old["run_id"], self.who)[1]
            state.pop("curriculum_version")
            db.execute("UPDATE runs SET state=? WHERE id=?", (json.dumps(state), old["run_id"]))
        with self.assertRaises(HTTPException) as caught:
            self.turn(old, "old answer")
        self.assertEqual(caught.exception.status_code, 409)
        resumed = learning.start(learning.StartRequest(mission_id=MISSIONS[1]["id"]), self.who)
        self.assertEqual(resumed["run_id"], old["run_id"])
        self.assertEqual(resumed["index"], 0)
        self.assertEqual(resumed["revision"], old["revision"]+1)
        self.assertEqual(resumed["curriculum_version"], CURRENT_VERSION)
        self.assertEqual(resumed["step"]["prompt"], MISSIONS[1]["steps"][0]["prompt"])
        self.assertEqual(resumed["progress"]["coins"], before["wallet"]["balance"])
        with self.store.connection() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM learning_events WHERE learner=?", (self.who,)).fetchone()[0], 4)
        with self.assertRaises(HTTPException):
            self.turn(old, "stale answer")
        self.assertTrue(self.turn(resumed, MISSIONS[1]["steps"][0]["example"])["correct"])

    def test_mode_specific_length_limit_does_not_save_an_invalid_event(self):
        run = self.begin(3)
        with self.assertRaises(HTTPException) as caught:
            self.turn(run, "a"*81)
        self.assertEqual(caught.exception.status_code, 422)
        self.assertEqual(self.store.get(run["run_id"], self.who)[1]["revision"], 0)
        with self.store.connection() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM learning_events").fetchone()[0], 0)

if __name__ == "__main__":
    unittest.main()
