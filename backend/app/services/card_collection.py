"""Server-earned eligibility and explicit learner opt-in for personal flashcards."""
from fastapi import HTTPException
from app.curriculum import VOCABULARY, mission_by_id
from app.curriculum.card_links import MISSION_CARDS, GUESS_CARDS
from app.repositories.flashcards import FlashcardRepository

def eligible_ids(store, who):
    completed = store.results(who)
    allowed = {cid for mid in completed for cid in MISSION_CARDS.get(mid, [])}
    with store.connection() as db:
        answered = db.execute("SELECT DISTINCT mission_id,step_id FROM learning_events WHERE learner=? AND action='answer' AND correct=1", (who,)).fetchall()
    allowed.update(GUESS_CARDS[(row["mission_id"],row["step_id"])] for row in answered
                   if (row["mission_id"],row["step_id"]) in GUESS_CARDS)
    return allowed

def card_data(card):
    chapters = {card["chapter_id"]}
    for mid, ids in MISSION_CARDS.items():
        if card["id"] in ids:
            chapters.add(mission_by_id(mid)["chapter_id"])
    return {**card, "chapter_ids": sorted(chapters)}

def candidates(store, who, mission_id=None, only_ids=None):
    allowed = eligible_ids(store, who)
    if mission_id:
        if not mission_by_id(mission_id):
            raise HTTPException(404, "没有找到这个练习。")
        allowed &= set(MISSION_CARDS.get(mission_id, []))
    if only_ids is not None:
        allowed &= set(only_ids)
    saved = FlashcardRepository(store).collected_ids(who)
    return [{**card_data(card), "collected": card["id"] in saved} for card in VOCABULARY if card["id"] in allowed]

def collect(store, who, ids):
    known = {card["id"] for card in VOCABULARY}
    chosen = set(ids)
    if not chosen <= known:
        raise HTTPException(404, "没有找到其中的单词。")
    if not chosen <= eligible_ids(store, who):
        raise HTTPException(403, "先猜对这个词或完成对应练习，再选择加入单词卡。")
    repository = FlashcardRepository(store)
    added = repository.collect(who, chosen)
    return {"added_count": added, "collected_ids": sorted(repository.collected_ids(who))}
