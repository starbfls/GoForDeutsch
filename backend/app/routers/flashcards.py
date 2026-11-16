"""Only explicitly collected cards appear in a student's personal library."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.curriculum import VOCABULARY
from app.dependencies import learner
from app.learning_store import store
from app.repositories.flashcards import FlashcardRepository
from app.schemas import FavoriteRequest, ReviewRequest, CollectCardsRequest
from app.services.review_schedule import initial_state, is_due
from app.services.card_collection import candidates, collect, card_data

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

def checked_card(card_id):
    card = next((word for word in VOCABULARY if word["id"] == card_id), None)
    if not card:
        raise HTTPException(404, "没有找到这张单词卡。")
    return card

def payload(card, state):
    return {**card_data(card), "review": state, "due": is_due(state)}

@router.get("")
def library(who: str = Depends(learner)):
    repository = FlashcardRepository(store)
    states, saved = repository.states(who), repository.collected_ids(who)
    cards = [payload(card, states.get(card["id"], initial_state())) for card in VOCABULARY if card["id"] in saved]
    return {"cards": cards, "due_count": sum(card["due"] for card in cards),
            "reviewed_count": sum(card["review"]["reviews"] > 0 for card in cards)}

@router.get("/candidates")
def collection_candidates(mission_id: str | None = Query(default=None, max_length=80), who: str = Depends(learner)):
    return {"cards": candidates(store, who, mission_id)}

@router.post("/collect")
def collect_cards(body: CollectCardsRequest, who: str = Depends(learner)):
    return collect(store, who, body.card_ids)

@router.post("/review")
def review(body: ReviewRequest, who: str = Depends(learner)):
    card = checked_card(body.card_id)
    state = FlashcardRepository(store).review(who, body.card_id, body.rating, str(body.review_id))
    return payload(card, state)

@router.post("/favorite")
def favorite(body: FavoriteRequest, who: str = Depends(learner)):
    card = checked_card(body.card_id)
    return payload(card, FlashcardRepository(store).favorite(who, body.card_id, body.favorite))
