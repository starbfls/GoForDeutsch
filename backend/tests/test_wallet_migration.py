"""Legacy migration, backups and spend-safe XP ledger behavior."""
import copy
import json
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path
from fastapi import HTTPException
from app.curriculum import MISSIONS
from app.learning_store import LearningStore
from app.repositories.wallet import WalletRepository
from app.repositories.records import LearningRecordRepository
from app.services.progress import progress_data


class WalletMigrationTests(unittest.TestCase):
    def setUp(self):
        self.directory = Path(__file__).resolve().parent
        self.temp = tempfile.TemporaryDirectory(dir=self.directory)
        self.addCleanup(self.cleanup)
        self.path = Path(self.temp.name) / "learning.sqlite3"
        self.who = "user:wallet-student"

    def cleanup(self):
        assert Path(self.temp.name).resolve().is_relative_to(self.directory)
        self.temp.cleanup()

    def funded_store(self):
        store = LearningStore(self.path)
        run_id, state = store.start(self.who, "bakery-first")
        state.update(index=3, completed=True, evidence=[])
        self.assertTrue(store.save(run_id, self.who, "bakery-first", state, 0))
        return store

    def test_purchase_is_idempotent_and_xp_reports_spendable_balance(self):
        store = self.funded_store()
        wallet = WalletRepository(store)
        self.assertEqual(wallet.spend(self.who, 15, "test-order-1")["balance"], 25)
        self.assertEqual(wallet.spend(self.who, 15, "test-order-1")["balance"], 25)
        self.assertEqual(progress_data(store, self.who)["xp"], 25)
        self.assertEqual(progress_data(store, self.who)["earned_xp"], 40)
        self.assertEqual(wallet.balance(self.who)["total_spent"], 15)
        transactions = wallet.transactions(self.who)["items"]
        self.assertEqual([item["amount"] for item in transactions], [-15, 40])
        with self.assertRaises(HTTPException):
            wallet.spend(self.who, 10, "test-order-1")
        self.assertEqual(WalletRepository(LearningStore(self.path)).balance(self.who)["balance"], 25)

    def test_concurrent_purchases_cannot_overdraw(self):
        wallet = WalletRepository(self.funded_store())
        def buy(index):
            try:
                wallet.spend(self.who, 30, f"concurrent-order-{index}")
                return True
            except HTTPException as error:
                self.assertEqual(error.status_code, 409)
                return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            purchases = list(pool.map(buy, range(2)))
        self.assertEqual(sum(purchases), 1)
        self.assertEqual(wallet.balance(self.who), {"currency": "COIN", "balance": 10, "total_earned": 40, "total_spent": 30})

    def test_invalid_or_unfunded_spend_cannot_change_wallet(self):
        wallet = WalletRepository(self.funded_store())
        for amount in (0, -1, True, 1.5):
            with self.assertRaises(ValueError):
                wallet.spend(self.who, amount, "bad-order")
        with self.assertRaises(HTTPException):
            wallet.spend("user:unfunded", 1, "no-money")
        with self.assertRaises(HTTPException):
            wallet.spend(self.who, 41, "too-expensive")
        self.assertEqual(wallet.balance(self.who)["balance"], 40)
        self.assertEqual(len(wallet.transactions(self.who)["items"]), 1)

    def test_concurrent_completion_cannot_double_credit(self):
        store = LearningStore(self.path)
        run_id, state = store.start(self.who, "bakery-first")
        state.update(index=3, completed=True, evidence=[])
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: store.save(run_id, self.who, "bakery-first", copy.deepcopy(state), 0), range(2)))
        self.assertEqual(sum(results), 1)
        self.assertEqual(WalletRepository(store).balance(self.who)["balance"], 40)
        self.assertEqual(len(WalletRepository(store).transactions(self.who)["items"]), 1)

    def test_legacy_upgrade_backs_up_and_preserves_records(self):
        done = {"index": 3, "completed": True, "attempts": {}, "hints": {}, "evidence": [], "revision": 3}
        active = {"index": 1, "completed": False, "attempts": {}, "hints": {}, "evidence": [], "revision": 1}
        with closing(sqlite3.connect(self.path)) as db, db:
            db.executescript("""
                CREATE TABLE runs(id TEXT PRIMARY KEY,learner TEXT,mission TEXT,state TEXT);
                CREATE TABLE results(learner TEXT,mission TEXT,state TEXT,PRIMARY KEY(learner,mission));
                CREATE TABLE api_budget(day TEXT PRIMARY KEY,calls INTEGER);
                CREATE TABLE flashcards(learner TEXT,card_id TEXT,state TEXT,PRIMARY KEY(learner,card_id));
            """)
            db.execute("INSERT INTO runs VALUES (?,?,?,?)", ("legacy-done", self.who, "bakery-first", json.dumps(done)))
            db.execute("INSERT INTO runs VALUES (?,?,?,?)", ("legacy-active", self.who, "bakery-picnic", json.dumps(active)))
            db.execute("INSERT INTO results VALUES (?,?,?)", (self.who, "bakery-first", json.dumps(done)))
            db.execute("INSERT INTO api_budget VALUES ('2026-11-10',7)")
            db.execute("INSERT INTO flashcards VALUES (?,?,?)", (self.who, "bakery-1", '{"favorite":true}'))
        store = LearningStore(self.path)
        self.assertTrue(Path(store.migration_backup).is_file())
        with closing(sqlite3.connect(store.migration_backup)) as backup:
            self.assertEqual(len(backup.execute("PRAGMA table_info(runs)").fetchall()), 4)
            self.assertEqual(json.loads(backup.execute("SELECT state FROM runs WHERE id='legacy-active'").fetchone()[0]), active)
        self.assertEqual(progress_data(store, self.who)["xp"], 40)
        self.assertEqual(progress_data(store, self.who)["current"]["run_id"], "legacy-active")
        self.assertEqual(progress_data(store, self.who)["current"]["step_number"], 2)
        self.assertIsNone(progress_data(store, self.who)["current"]["updated_at"])
        self.assertEqual(LearningRecordRepository(store).history(self.who)["items"], [])
        with store.connection() as db:
            self.assertEqual(db.execute("SELECT calls FROM api_budget").fetchone()[0], 7)
            self.assertEqual(json.loads(db.execute("SELECT state FROM flashcards").fetchone()[0]), {"favorite": True})
        WalletRepository(store).spend(self.who, 10, "after-migration")
        reopened = LearningStore(self.path)
        self.assertIsNone(reopened.migration_backup)
        self.assertEqual(WalletRepository(reopened).balance(self.who)["balance"], 30)
        self.assertEqual(len(list((self.path.parent / "backups").glob("*.sqlite3"))), 1)
        self.assertEqual(len(WalletRepository(reopened).transactions(self.who)["items"]), 2)
