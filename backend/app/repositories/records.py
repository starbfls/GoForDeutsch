"""Per-account study position and immutable submitted-answer history."""
import json


def touch_position(db, learner, mission, run_id, state, now):
    db.execute(
        """INSERT INTO learner_positions(learner,unit_id,chapter_id,mission_id,run_id,step_index,completed,updated_at)
        VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(learner) DO UPDATE SET
        unit_id=excluded.unit_id,chapter_id=excluded.chapter_id,mission_id=excluded.mission_id,
        run_id=excluded.run_id,step_index=excluded.step_index,completed=excluded.completed,updated_at=excluded.updated_at""",
        (learner, mission["unit_id"], mission["chapter_id"], mission["id"], run_id, state["index"], int(state["completed"]), now),
    )


def append_turn(db, learner, run_id, revision, mission, event, now):
    db.execute(
        """INSERT INTO learning_events(learner,run_id,revision,unit_id,chapter_id,mission_id,step_id,step_index,
        action,answer,question,correct,attempt_count,hint_count,feedback,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (learner, run_id, revision, mission["unit_id"], mission["chapter_id"], mission["id"],
         event["step_id"], event["step_index"], event["action"], event["answer"], event["question"],
         None if event["correct"] is None else int(event["correct"]), event["attempt_count"], event["hint_count"],
         json.dumps(event["feedback"], ensure_ascii=False), now),
    )


class LearningRecordRepository:
    def __init__(self, store):
        self.store = store

    def snapshot(self, learner):
        from app.repositories.wallet import balance_in
        with self.store.connection() as db:
            # Read progress and the wallet from the same committed database snapshot.
            db.execute("BEGIN")
            results = {row["mission"]: json.loads(row["state"]) for row in db.execute("SELECT mission,state FROM results WHERE learner=?", (learner,))}
            runs = {}
            for row in db.execute("SELECT id,mission,state,created_at,updated_at FROM runs WHERE learner=? ORDER BY rowid", (learner,)):
                runs[row["mission"]] = {**dict(row), "state": json.loads(row["state"])}
            position = db.execute("SELECT unit_id,chapter_id,mission_id,run_id,step_index,completed,updated_at FROM learner_positions WHERE learner=?", (learner,)).fetchone()
            wallet = balance_in(db, learner)
        return {"results": results, "runs": runs, "position": dict(position) if position else None, "wallet": wallet}

    def history(self, learner, limit=20, before=None, mission_id=None):
        with self.store.connection() as db:
            rows = db.execute(
                """SELECT seq,run_id,revision,unit_id,chapter_id,mission_id,step_id,step_index,
                action,answer,question,correct,attempt_count,hint_count,feedback,created_at
                FROM learning_events WHERE learner=? AND (? IS NULL OR seq<?) AND (? IS NULL OR mission_id=?)
                ORDER BY seq DESC LIMIT ?""",
                (learner, before, before, mission_id, mission_id, limit + 1),
            ).fetchall()
        items = []
        for row in rows[:limit]:
            item = dict(row)
            item["correct"] = None if item["correct"] is None else bool(item["correct"])
            item["feedback"] = json.loads(item["feedback"])
            items.append(item)
        return {"items": items, "next_before": items[-1]["seq"] if len(rows) > limit else None}
