"""Personal collection, existing review state, and idempotent self-rated reviews."""
import json
from datetime import datetime, timezone
from fastapi import HTTPException
from app.services.review_schedule import initial_state, schedule

class FlashcardRepository:
    def __init__(self, store):
        self.store = store
        with store.connection() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS flashcards (
                    learner TEXT, card_id TEXT, state TEXT NOT NULL, PRIMARY KEY(learner,card_id));
                CREATE TABLE IF NOT EXISTS card_review_events (
                    learner TEXT, event_id TEXT, card_id TEXT NOT NULL, PRIMARY KEY(learner,event_id));
                CREATE TABLE IF NOT EXISTS flashcard_collection (
                    learner TEXT NOT NULL, card_id TEXT NOT NULL, added_at TEXT NOT NULL,
                    PRIMARY KEY(learner,card_id));
            """)

    def states(self, learner):
        with self.store.connection() as db:
            return {row["card_id"]: json.loads(row["state"]) for row in db.execute(
                "SELECT card_id,state FROM flashcards WHERE learner=?", (learner,))}

    def collected_ids(self, learner):
        with self.store.connection() as db:
            return {row["card_id"] for row in db.execute(
                "SELECT card_id FROM flashcard_collection WHERE learner=?", (learner,))}

    def collect(self, learner, ids):
        added = 0
        with self.store.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            now = datetime.now(timezone.utc).isoformat()
            for cid in sorted(set(ids)):
                added += db.execute("INSERT OR IGNORE INTO flashcard_collection VALUES (?,?,?)",
                                    (learner, cid, now)).rowcount
        return added

    @staticmethod
    def require_collected(db, learner, card_id):
        if not db.execute("SELECT 1 FROM flashcard_collection WHERE learner=? AND card_id=?", (learner,card_id)).fetchone():
            raise HTTPException(403, "先把这个词加入单词卡，再进行复习或收藏。")

    def review(self, learner, card_id, rating, event_id, now=None):
        with self.store.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            self.require_collected(db, learner, card_id)
            previous_event = db.execute("SELECT card_id FROM card_review_events WHERE learner=? AND event_id=?", (learner,event_id)).fetchone()
            row = db.execute("SELECT state FROM flashcards WHERE learner=? AND card_id=?", (learner,card_id)).fetchone()
            current = json.loads(row[0]) if row else initial_state(now)
            if previous_event:
                if previous_event[0] != card_id:
                    raise HTTPException(409, "这次复习请求已经用于另一张卡片，请重新翻卡。")
                return current
            state = schedule(current, rating, now)
            db.execute("INSERT INTO flashcards VALUES (?,?,?) ON CONFLICT(learner,card_id) DO UPDATE SET state=excluded.state",
                       (learner,card_id,json.dumps(state)))
            db.execute("INSERT INTO card_review_events VALUES (?,?,?)", (learner,event_id,card_id))
            return state

    def favorite(self, learner, card_id, favorite):
        with self.store.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            self.require_collected(db, learner, card_id)
            row = db.execute("SELECT state FROM flashcards WHERE learner=? AND card_id=?", (learner,card_id)).fetchone()
            state = json.loads(row[0]) if row else initial_state()
            state["favorite"] = favorite
            db.execute("INSERT INTO flashcards VALUES (?,?,?) ON CONFLICT(learner,card_id) DO UPDATE SET state=excluded.state",
                       (learner,card_id,json.dumps(state)))
            return state
