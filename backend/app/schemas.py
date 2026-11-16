"""Request payloads shared by learning HTTP routes."""
from typing import Literal, Annotated
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class StartRequest(BaseModel):
    mission_id: str = Field(max_length=80)


class TurnRequest(BaseModel):
    run_id: str
    revision: int
    action: Literal["answer", "hint", "example", "ask"]
    answer: str = Field(default="", max_length=1200)
    question: str = Field(default="", max_length=300)


class ReviewRequest(BaseModel):
    card_id: str = Field(max_length=80)
    rating: Literal["again", "hard", "good", "easy"]
    review_id: UUID


class FavoriteRequest(BaseModel):
    card_id: str = Field(max_length=80)
    favorite: bool


class CollectCardsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    card_ids: list[Annotated[str, Field(min_length=1, max_length=80)]] = Field(min_length=1, max_length=30)
