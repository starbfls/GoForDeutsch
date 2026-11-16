"""Atomic ownership, equipment and purchases in the existing account database."""
from datetime import datetime,timezone
from fastapi import HTTPException
from app.wardrobe_catalog import DEFAULT_OUTFIT, REWARD_OUTFIT, REWARD_MISSIONS, OUTFITS, outfit_by_id
from app.repositories.wallet import spend_in, balance_in

def shop_unlocked(db, learner):
    completed={row[0] for row in db.execute("SELECT mission FROM results WHERE learner=?",(learner,))}
    return all(mid in completed for mid in REWARD_MISSIONS)

def grant_reward(db, learner, now):
    if shop_unlocked(db,learner):
        db.execute("INSERT OR IGNORE INTO wardrobe_items(learner,outfit_id,source,created_at) VALUES (?,?,?,?)",
                   (learner,REWARD_OUTFIT,"clothing_reward",now))

def snapshot_in(db,learner):
    unlocked=shop_unlocked(db,learner)
    owned={DEFAULT_OUTFIT}|{row[0] for row in db.execute("SELECT outfit_id FROM wardrobe_items WHERE learner=?",(learner,))}
    row=db.execute("SELECT outfit_id FROM wardrobe_preferences WHERE learner=?",(learner,)).fetchone()
    equipped=row[0] if row and row[0] in owned else DEFAULT_OUTFIT
    completed={row[0] for row in db.execute("SELECT mission FROM results WHERE learner=?",(learner,))}
    return {"shop_unlocked":unlocked,"equipped":equipped,"unlock_completed":sum(mid in completed for mid in REWARD_MISSIONS),
            "unlock_total":len(REWARD_MISSIONS),"catalog":[{**item,"owned":item["id"] in owned} for item in OUTFITS],
            "wallet":balance_in(db,learner)}

class WardrobeRepository:
    def __init__(self,store): self.store=store
    def snapshot(self,learner):
        with self.store.connection() as db:
            # Also reconcile a completed reward after a code update; this never debits coins.
            grant_reward(db,learner,datetime.now(timezone.utc).isoformat())
            return snapshot_in(db,learner)
    def equip(self,learner,outfit_id):
        if not outfit_by_id(outfit_id):raise HTTPException(404,"没有找到这套服装。")
        now=datetime.now(timezone.utc).isoformat()
        with self.store.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            grant_reward(db,learner,now)
            owned=outfit_id==DEFAULT_OUTFIT or db.execute("SELECT 1 FROM wardrobe_items WHERE learner=? AND outfit_id=?",(learner,outfit_id)).fetchone()
            if not owned:raise HTTPException(403,"先获得这套服装，再到背包更换。")
            db.execute("INSERT INTO wardrobe_preferences VALUES (?,?,?) ON CONFLICT(learner) DO UPDATE SET outfit_id=excluded.outfit_id,updated_at=excluded.updated_at",(learner,outfit_id,now))
            return snapshot_in(db,learner)
    def purchase(self,learner,outfit_id):
        item=outfit_by_id(outfit_id)
        if not item:raise HTTPException(404,"没有找到这套服装。")
        now=datetime.now(timezone.utc).isoformat()
        with self.store.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            grant_reward(db,learner,now)
            if not shop_unlocked(db,learner):raise HTTPException(403,"完成服装店三个练习后开启商店。")
            if item["source"]!="shop":raise HTTPException(409,"这套服装由任务或初始背包提供。")
            if not db.execute("SELECT 1 FROM wardrobe_items WHERE learner=? AND outfit_id=?",(learner,outfit_id)).fetchone():
                spend_in(db,learner,item["price"],"outfit:"+outfit_id,now)
                db.execute("INSERT INTO wardrobe_items VALUES (?,?,?,?)",(learner,outfit_id,"shop",now))
            return snapshot_in(db,learner)
