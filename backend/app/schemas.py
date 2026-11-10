"""Request payloads shared by learning HTTP routes."""
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field


class StartRequest(BaseModel):
    mission_id: str = Field(max_length=80)


class TurnRequest(BaseModel):
    run_id: str
    revision: int
    action: Literal["answer", "hint", "example", "ask"]
    answer: str = Field(default="", max_length=300)
    question: str = Field(default="", max_length=300)


class ReviewRequest(BaseModel):
    card_id: str = Field(max_length=80)
    rating: Literal["again", "hard", "good", "easy"]
    review_id: UUID


class FavoriteRequest(BaseModel):
    card_id: str = Field(max_length=80)
    favorite: bool
