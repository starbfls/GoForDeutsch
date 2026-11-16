"""SQLite transactions own progress, rewards and global API reservations."""
import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.config import DATA_DIR
from app.curriculum import mission_by_id
from app.curriculum import CURRENT_VERSION
from app.repositories.learning_schema import initialize
from app.repositories.records import append_turn, touch_position
from app.repositories.wallet import credit_mission


class LearningStore:
    def __init__(self, path=None):
        self.path = str(path or Path(DATA_DIR) / "learning.sqlite3")
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            self.migration_backup = initialize(db, self.path)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            db.row_factory = sqlite3.Row
            db.execute("PRAGMA foreign_keys=ON")
            with db:
                yield db
        finally:
            db.close()

    def start(self, learner, mission_id):
        now = datetime.now(timezone.utc).isoformat()
        mission = mission_by_id(mission_id)
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            rows = db.execute("SELECT id,state FROM runs WHERE learner=? AND mission=? ORDER BY rowid DESC", (learner, mission_id)).fetchall()
            for row in rows:
                state = json.loads(row["state"])
                if not state["completed"]:
                    if state.get("curriculum_version",1) < CURRENT_VERSION:
                        state = {"index":0,"completed":False,"attempts":{},"hints":{},"evidence":[],
                                 "revision":state["revision"]+1,"curriculum_version":CURRENT_VERSION}
                        db.execute("UPDATE runs SET state=? WHERE id=?", (json.dumps(state),row["id"]))
                    db.execute("UPDATE runs SET updated_at=? WHERE id=?", (now, row["id"]))
                    if mission:
                        touch_position(db, learner, mission, row["id"], state, now)
                    return row["id"], state
            run_id = str(uuid.uuid4())
            state = {"index": 0, "completed": False, "attempts": {}, "hints": {}, "evidence": [], "revision": 0, "curriculum_version":CURRENT_VERSION}
            db.execute("INSERT INTO runs(id,learner,mission,state,created_at,updated_at) VALUES (?,?,?,?,?,?)", (run_id, learner, mission_id, json.dumps(state), now, now))
            if mission:
                touch_position(db, learner, mission, run_id, state, now)
            return run_id, state

    def get(self, run_id, learner):
        with self.connection() as db:
            row = db.execute("SELECT mission,state FROM runs WHERE id=? AND learner=?", (run_id, learner)).fetchone()
            return (row["mission"], json.loads(row["state"])) if row else None

    def save(self, run_id, learner, mission_id, state, old_revision, event=None):
        now = datetime.now(timezone.utc).isoformat()
        mission = mission_by_id(mission_id)
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT mission,state FROM runs WHERE id=? AND learner=?", (run_id, learner)).fetchone()
            if not row or row["mission"] != mission_id or json.loads(row["state"])["revision"] != old_revision:
                return False
            state["revision"] = old_revision + 1
            if state["completed"] and mission:
                state["reward_coins"] = credit_mission(db, learner, mission_id, mission.get("reward_coins",mission["xp"]), run_id, now)
            db.execute("UPDATE runs SET state=?,updated_at=? WHERE id=?", (json.dumps(state, ensure_ascii=False), now, run_id))
            if mission:
                touch_position(db, learner, mission, run_id, state, now)
                if event is not None:
                    append_turn(db, learner, run_id, state["revision"], mission, event, now)
            if state["completed"]:
                db.execute("INSERT INTO results(learner,mission,state) VALUES (?,?,?) ON CONFLICT(learner,mission) DO UPDATE SET state=excluded.state", (learner, mission_id, json.dumps(state, ensure_ascii=False)))
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
