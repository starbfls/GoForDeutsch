"""Coin balances and idempotent ledger entries; callers supply server-owned prices."""
import uuid
from fastapi import HTTPException


def balance_in(db, learner):
    row = db.execute("SELECT balance,total_earned,total_spent FROM wallets WHERE learner=?", (learner,)).fetchone()
    return {"currency": "COIN", **dict(row)} if row else {"currency": "COIN", "balance": 0, "total_earned": 0, "total_spent": 0}


def credit_mission(db, learner, mission_id, amount, run_id, now):
    previous = db.execute("SELECT id FROM wallet_transactions WHERE learner=? AND kind='mission_reward' AND source_id=?", (learner, mission_id)).fetchone()
    if previous or amount <= 0:
        return 0
    db.execute("INSERT INTO wallets(learner,balance,total_earned,total_spent,updated_at) VALUES (?,0,0,0,?) ON CONFLICT(learner) DO NOTHING", (learner, now))
    db.execute("UPDATE wallets SET balance=balance+?,total_earned=total_earned+?,updated_at=? WHERE learner=?", (amount, amount, now, learner))
    balance = balance_in(db, learner)["balance"]
    db.execute("INSERT INTO wallet_transactions(id,learner,kind,source_id,amount,balance_after,run_id,created_at) VALUES (?,?,'mission_reward',?,?,?,?,?)", (str(uuid.uuid4()), learner, mission_id, amount, balance, run_id, now))

    return amount


class WalletRepository:
    def __init__(self, store):
        self.store = store

    def balance(self, learner):
        with self.store.connection() as db:
            return balance_in(db, learner)

    def transactions(self, learner, limit=20, before=None):
        with self.store.connection() as db:
            rows = db.execute(
                "SELECT seq,id,kind,source_id,amount,balance_after,run_id,created_at FROM wallet_transactions WHERE learner=? AND (? IS NULL OR seq<?) ORDER BY seq DESC LIMIT ?",
                (learner, before, before, limit + 1),
            ).fetchall()
        items = [dict(row) for row in rows[:limit]]
        return {"items": items, "next_before": items[-1]["seq"] if len(rows) > limit else None}

    def spend(self, learner, amount, purchase_id):
        """Internal integration point for a future shop; deliberately has no HTTP route."""
        if type(amount) is not int or amount <= 0 or not isinstance(purchase_id, str) or not 1 <= len(purchase_id) <= 100:
            raise ValueError("A positive integer price and a purchase identifier are required.")
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        with self.store.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            previous = db.execute("SELECT amount FROM wallet_transactions WHERE learner=? AND kind='purchase' AND source_id=?", (learner, purchase_id)).fetchone()
            if previous:
                if previous["amount"] != -amount:
                    raise HTTPException(409, "这笔购买记录与原价格不一致。")
                return balance_in(db, learner)
            changed = db.execute(
                "UPDATE wallets SET balance=balance-?,total_spent=total_spent+?,updated_at=? WHERE learner=? AND balance>=?",
                (amount, amount, now, learner, amount),
            ).rowcount
            if not changed:
                raise HTTPException(409, "金币余额不足。")
            balance = balance_in(db, learner)
            db.execute("INSERT INTO wallet_transactions(id,learner,kind,source_id,amount,balance_after,created_at) VALUES (?,?,'purchase',?,?,?,?)",
                       (str(uuid.uuid4()), learner, purchase_id, -amount, balance["balance"], now))
            return balance
