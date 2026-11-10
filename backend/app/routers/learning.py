"""Learning endpoints; lesson execution is owned by the service layer."""
from fastapi import APIRouter, Depends
from app.curriculum import CHAPTERS, UNITS, VOCABULARY, public_missions
from app.dependencies import learner
from app.learning_store import store
from app.schemas import StartRequest, TurnRequest
from app.services.learning import progress_data as build_progress, start_run, submit_turn, _requests
from app.tutor import ai_status

router = APIRouter(prefix="/learning", tags=["learning"])


def progress_data(who):
    return build_progress(store, who)


@router.get("/bootstrap")
def bootstrap(who: str = Depends(learner)):
    return {"units":UNITS,"chapters":CHAPTERS,"missions":public_missions(),"vocabulary":VOCABULARY,"progress":progress_data(who),"ai":ai_status()}


@router.post("/start")
def start(body: StartRequest, who: str = Depends(learner)):
    return start_run(store, body.mission_id, who)


@router.post("/turn")
def turn(body: TurnRequest, who: str = Depends(learner)):
    return submit_turn(store, body, who)
