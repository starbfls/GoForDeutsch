"""Additive SQLite upgrade with a pre-migration backup of existing learning data."""
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from app.curriculum import mission_by_id
from app.repositories.records import touch_position
from app.repositories.wallet import credit_mission

VERSION = "activity_wallet_v1"

SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, learner TEXT NOT NULL, mission TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS results (learner TEXT, mission TEXT, state TEXT NOT NULL, PRIMARY KEY(learner,mission));
CREATE TABLE IF NOT EXISTS api_budget (day TEXT PRIMARY KEY, calls INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS learner_positions (
    learner TEXT PRIMARY KEY, unit_id TEXT NOT NULL, chapter_id TEXT NOT NULL, mission_id TEXT NOT NULL,
    run_id TEXT NOT NULL REFERENCES runs(id), step_index INTEGER NOT NULL CHECK(step_index>=0),
    completed INTEGER NOT NULL CHECK(completed IN (0,1)), updated_at TEXT);
CREATE TABLE IF NOT EXISTS learning_events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT, learner TEXT NOT NULL, run_id TEXT NOT NULL REFERENCES runs(id),
    revision INTEGER NOT NULL, unit_id TEXT NOT NULL, chapter_id TEXT NOT NULL, mission_id TEXT NOT NULL,
    step_id TEXT NOT NULL, step_index INTEGER NOT NULL, action TEXT NOT NULL CHECK(action IN ('answer','hint','example','ask')),
    answer TEXT NOT NULL, question TEXT NOT NULL, correct INTEGER CHECK(correct IN (0,1)),
    attempt_count INTEGER NOT NULL, hint_count INTEGER NOT NULL, feedback TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(run_id,revision));
CREATE INDEX IF NOT EXISTS learning_events_owner ON learning_events(learner,seq);
CREATE INDEX IF NOT EXISTS learning_events_mission ON learning_events(learner,mission_id,seq);
CREATE INDEX IF NOT EXISTS runs_owner ON runs(learner,mission);
CREATE TABLE IF NOT EXISTS wallets (
    learner TEXT PRIMARY KEY, balance INTEGER NOT NULL CHECK(balance>=0),
    total_earned INTEGER NOT NULL CHECK(total_earned>=0), total_spent INTEGER NOT NULL CHECK(total_spent>=0),
    updated_at TEXT NOT NULL, CHECK(balance=total_earned-total_spent));
CREATE TABLE IF NOT EXISTS wallet_transactions (
    seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, learner TEXT NOT NULL REFERENCES wallets(learner),
    kind TEXT NOT NULL CHECK(kind IN ('mission_reward','purchase')), source_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK(amount!=0), balance_after INTEGER NOT NULL CHECK(balance_after>=0),
    run_id TEXT REFERENCES runs(id), created_at TEXT NOT NULL, UNIQUE(learner,kind,source_id));
CREATE INDEX IF NOT EXISTS wallet_transactions_owner ON wallet_transactions(learner,seq);
CREATE TABLE IF NOT EXISTS wardrobe_items (
 learner TEXT NOT NULL,outfit_id TEXT NOT NULL,source TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(learner,outfit_id));
CREATE TABLE IF NOT EXISTS wardrobe_preferences (
 learner TEXT PRIMARY KEY,outfit_id TEXT NOT NULL,updated_at TEXT NOT NULL);
"""


def initialize(db, path):
    tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    applied = "schema_migrations" in tables and db.execute("SELECT 1 FROM schema_migrations WHERE version=?", (VERSION,)).fetchone()
    backup = None
    if "runs" in tables and not applied:
        directory = Path(path).parent / "backups"
        directory.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup = directory / f"learning-before-{VERSION}-{stamp}-{uuid.uuid4().hex[:8]}.sqlite3"
        destination = sqlite3.connect(str(backup))
        try:
            db.backup(destination)
        finally:
            destination.close()
    db.executescript(SCHEMA)
    db.execute("BEGIN IMMEDIATE")
    applied = db.execute("SELECT 1 FROM schema_migrations WHERE version=?", (VERSION,)).fetchone()
    columns = {row["name"] for row in db.execute("PRAGMA table_info(runs)")}
    for column in ("created_at", "updated_at"):
        if column not in columns:
            db.execute(f"ALTER TABLE runs ADD COLUMN {column} TEXT")
    if not applied:
        now = datetime.now(timezone.utc).isoformat()
        # Unknown historical answers/times stay unknown; never fabricate old submissions.
        for row in db.execute("SELECT learner,mission FROM results"):
            mission = mission_by_id(row["mission"])
            if mission:
                credit_mission(db, row["learner"], mission["id"], mission["xp"], None, now)
        latest = {}
        for row in db.execute("SELECT id,learner,mission,state,updated_at FROM runs ORDER BY rowid"):
            if mission_by_id(row["mission"]):
                latest[row["learner"]] = row
        for learner, row in latest.items():
            touch_position(db, learner, mission_by_id(row["mission"]), row["id"], json.loads(row["state"]), row["updated_at"])
        db.execute("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES (?,?)", (VERSION, now))
    return str(backup) if backup else None
