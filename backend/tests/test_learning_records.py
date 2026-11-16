"""Study records, exact submissions, persistence and transactional XP rewards."""
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi import HTTPException
from app import tutor
from app.curriculum import MISSIONS
from app.learning_store import LearningStore
from app.repositories.records import LearningRecordRepository
from app.repositories.wallet import WalletRepository
from app.schemas import TurnRequest
from app.services import learning
from app.services.progress import progress_data


class LearningRecordTests(unittest.TestCase):
    def setUp(self):
        self.directory = Path(__file__).resolve().parent
        self.temp = tempfile.TemporaryDirectory(dir=self.directory)
        self.addCleanup(self.cleanup)
        self.store = LearningStore(Path(self.temp.name) / "records.sqlite3")
        self.who = "user:student-a"
        self.records = LearningRecordRepository(self.store)
        self.wallet = WalletRepository(self.store)
        self.local_tutor = patch.object(tutor, "AI_ENABLED", False)
        self.local_tutor.start()
        self.addCleanup(self.local_tutor.stop)
        learning._requests.clear()

    def cleanup(self):
        assert Path(self.temp.name).resolve().is_relative_to(self.directory)
        self.temp.cleanup()

    def begin(self, mission_id="bakery-first", who=None):
        return learning.start_run(self.store, mission_id, who or self.who)

    def move(self, run, action="answer", answer="", question="", who=None):
        body = TurnRequest(run_id=run["run_id"], revision=run["revision"], action=action, answer=answer, question=question)
        return learning.submit_turn(self.store, body, who or self.who)

    def correct(self, run):
        mission = next(item for item in MISSIONS if item["id"] == run["mission_id"])
        step = mission["steps"][run["index"]]
        return self.move(run, answer=step.get("answer", step.get("example", "")))

    def finish(self, run):
        while not run["completed"]:
            run = self.correct(run)
        return run

    def test_new_account_has_explicit_unstarted_states(self):
        progress = progress_data(self.store, self.who)
        self.assertIsNone(progress["current"])
        self.assertEqual(progress["xp"], 0)
        self.assertEqual(len(progress["mission_statuses"]), len(MISSIONS))
        self.assertTrue(all(item["status"] == "not_started" for item in progress["mission_statuses"]))
        self.assertTrue(all(item["status"] == "not_started" for item in progress["chapters"]))

    def test_raw_wrong_answers_and_questions_are_kept_with_feedback(self):
        run = self.begin()
        raw = "  Brötchen <b>测试</b> ' ; --  "
        run = self.move(run, answer=raw)
        question = "为什么 Brötchen 用 das？"
        run = self.move(run, action="ask", question=question)
        events = self.records.history(self.who)["items"]
        self.assertEqual(events[1]["answer"], raw)
        self.assertFalse(events[1]["correct"])
        self.assertEqual(events[1]["attempt_count"], 1)
        self.assertEqual(events[0]["question"], question)
        self.assertIsNone(events[0]["correct"])
        self.assertEqual(events[0]["feedback"]["source"], "local")
        self.assertTrue(events[0]["created_at"].endswith("+00:00"))
        self.assertEqual(events[0]["mission_id"], "bakery-first")
        self.assertEqual(events[0]["chapter_id"], "bakery")
        self.assertEqual(events[0]["unit_id"], "kennenlernen")
        self.assertEqual(progress_data(self.store, self.who)["current"]["step_number"], 1)

    def test_sentence_submission_and_first_reward_are_persisted(self):
        run = self.correct(self.correct(self.begin()))
        sentence = "Mia braucht zwei Brötchen."
        result = self.move(run, answer=sentence)
        self.assertTrue(result["completed"])
        event = self.records.history(self.who)["items"][0]
        self.assertEqual(event["answer"], sentence)
        self.assertTrue(event["correct"])
        self.assertEqual(self.wallet.balance(self.who)["balance"], 40)
        self.assertEqual(len(self.wallet.transactions(self.who)["items"]), 1)

    def test_reopening_preserves_position_history_and_balance(self):
        run = self.correct(self.begin())
        reopened = LearningStore(self.store.path)
        progress = progress_data(reopened, self.who)
        self.assertEqual(progress["current"]["run_id"], run["run_id"])
        self.assertEqual(progress["current"]["chapter_number"], 1)
        self.assertEqual(progress["current"]["mission_number"], 1)
        self.assertEqual(progress["current"]["unit_number"], 1)
        self.assertEqual(progress["current"]["step_number"], 2)
        self.assertEqual(progress["mission_statuses"][0]["status"], "in_progress")
        self.assertEqual(learning.start_run(reopened, "bakery-first", self.who)["index"], 1)
        self.assertEqual(len(LearningRecordRepository(reopened).history(self.who)["items"]), 1)

    def test_replays_append_history_without_double_rewards(self):
        self.finish(self.begin())
        self.finish(self.begin())
        self.assertEqual(len(self.records.history(self.who)["items"]), 6)
        self.assertEqual(self.wallet.balance(self.who)["total_earned"], 40)
        self.assertEqual(len(self.wallet.transactions(self.who)["items"]), 1)
        self.assertEqual(progress_data(self.store, self.who)["mission_statuses"][0]["status"], "completed")

    def test_records_runs_and_wallet_are_isolated_by_account(self):
        run = self.begin()
        self.move(run, answer="Student A private answer")
        with self.assertRaises(HTTPException) as caught:
            self.move(run, answer="Student B", who="user:student-b")
        self.assertEqual(caught.exception.status_code, 404)
        self.assertEqual(self.records.history("user:student-b")["items"], [])
        self.assertIsNone(progress_data(self.store, "user:student-b")["current"])
        self.assertEqual(self.wallet.balance("user:student-b")["balance"], 0)
        self.assertEqual(self.records.history("guest:student-a")["items"], [])

    def test_repeated_revision_does_not_append_duplicate_history(self):
        run = self.begin()
        self.correct(run)
        with self.assertRaises(HTTPException) as caught:
            self.correct(run)
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(len(self.records.history(self.who)["items"]), 1)

    def test_reward_failure_rolls_back_answer_position_and_completion(self):
        run = self.correct(self.correct(self.begin()))
        with self.store.connection() as db:
            db.execute("CREATE TRIGGER reject_reward BEFORE INSERT ON wallet_transactions BEGIN SELECT RAISE(ABORT,'injected failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            self.correct(run)
        saved = self.store.get(run["run_id"], self.who)[1]
        self.assertEqual(saved["revision"], run["revision"])
        self.assertFalse(saved["completed"])
        self.assertEqual(len(self.records.history(self.who)["items"]), 2)
        self.assertEqual(self.wallet.balance(self.who)["balance"], 0)
        self.assertEqual(progress_data(self.store, self.who)["current"]["step_number"], 3)
        self.assertEqual(self.store.results(self.who), {})
        with self.store.connection() as db:
            db.execute("DROP TRIGGER reject_reward")
        self.assertTrue(self.correct(run)["completed"])
        self.assertEqual(len(self.records.history(self.who)["items"]), 3)
        self.assertEqual(self.wallet.balance(self.who)["balance"], 40)

    def test_history_pagination_preserves_account_scope(self):
        self.finish(self.begin())
        first = self.records.history(self.who, limit=2, mission_id="bakery-first")
        second = self.records.history(self.who, limit=2, before=first["next_before"])
        self.assertEqual(len(first["items"]), 2)
        self.assertEqual(len(second["items"]), 1)
        self.assertIsNone(second["next_before"])
        self.assertGreater(first["items"][-1]["seq"], second["items"][0]["seq"])
        self.assertEqual(self.records.history("user:other", before=first["next_before"])["items"], [])
