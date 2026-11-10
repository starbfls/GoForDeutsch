"""SQLite transactions own progress, rewards and global API reservations."""
import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.config import DATA_DIR


class LearningStore:
    def __init__(self, path=None):
        self.path = str(path or Path(DATA_DIR) / "learning.sqlite3")
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, learner TEXT NOT NULL, mission TEXT NOT NULL, state TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS results (learner TEXT, mission TEXT, state TEXT NOT NULL, PRIMARY KEY(learner, mission));
                CREATE TABLE IF NOT EXISTS api_budget (day TEXT PRIMARY KEY, calls INTEGER NOT NULL);
            """)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            db.row_factory = sqlite3.Row
            with db:
                yield db
        finally:
            db.close()

    def start(self, learner, mission_id):
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            rows = db.execute("SELECT id,state FROM runs WHERE learner=? AND mission=? ORDER BY rowid DESC", (learner, mission_id)).fetchall()
            for row in rows:
                state = json.loads(row["state"])
                if not state["completed"]:
                    return row["id"], state
            run_id = str(uuid.uuid4())
            state = {"index": 0, "completed": False, "attempts": {}, "hints": {}, "evidence": [], "revision": 0}
            db.execute("INSERT INTO runs VALUES (?,?,?,?)", (run_id, learner, mission_id, json.dumps(state)))
            return run_id, state

    def get(self, run_id, learner):
        with self.connection() as db:
            row = db.execute("SELECT mission,state FROM runs WHERE id=? AND learner=?", (run_id, learner)).fetchone()
            return (row["mission"], json.loads(row["state"])) if row else None

    def save(self, run_id, learner, mission_id, state, old_revision):
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT state FROM runs WHERE id=? AND learner=?", (run_id, learner)).fetchone()
            if not row or json.loads(row[0])["revision"] != old_revision:
                return False
            state["revision"] = old_revision + 1
            db.execute("UPDATE runs SET state=? WHERE id=?", (json.dumps(state, ensure_ascii=False), run_id))
            if state["completed"]:
                # Replays cannot farm XP. Keep latest evidence, but reward just once.
                db.execute("INSERT INTO results VALUES (?,?,?) ON CONFLICT(learner,mission) DO UPDATE SET state=excluded.state", (learner, mission_id, json.dumps(state, ensure_ascii=False)))
            return True

    def results(self, learner):
        with self.connection() as db:
            return {row["mission"]: json.loads(row["state"]) for row in db.execute("SELECT mission,state FROM results WHERE learner=?", (learner,))}

    def active_missions(self, learner):
        with self.connection() as db:
            return {row["mission"] for row in db.execute("SELECT mission,state FROM runs WHERE learner=?",(learner,)) if not json.loads(row["state"])["completed"]}

    def reserve_api_call(self, limit):
        day = datetime.now(timezone.utc).date().isoformat()
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT calls FROM api_budget WHERE day=?", (day,)).fetchone()
            calls = row[0] if row else 0
            if calls >= limit:
                return False
            db.execute("INSERT INTO api_budget VALUES (?,1) ON CONFLICT(day) DO UPDATE SET calls=calls+1", (day,))
            return True


store = LearningStore()
