import time
import uuid
from collections import defaultdict
from threading import Lock
from typing import Literal

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.auth import decode_access_token
from app.curriculum import MISSIONS, VOCABULARY, check_answer, mission_by_id, public_missions, public_step
from app.learning_store import store
from app.tutor import ai_status, respond

router = APIRouter(prefix="/learning", tags=["learning"])
_locks = [Lock() for _ in range(64)]
_requests = defaultdict(list)


def learner(authorization: str | None = Header(default=None), x_learner_id: str | None = Header(default=None)):
    if authorization:
        try:
            token = authorization.removeprefix("Bearer ")
            return "user:" + decode_access_token(token)["sub"]
        except (jwt.PyJWTError, KeyError, TypeError):
            raise HTTPException(401, "登录已过期，请重新登录。")
    try:
        return "guest:" + str(uuid.UUID(x_learner_id or ""))
    except ValueError:
        raise HTTPException(400, "请刷新页面以创建本地体验身份。")


def progress_data(who):
    results = store.results(who)
    completed = list(results)
    evidence = [item for result in results.values() for item in result["evidence"]]
    xp = sum(m["xp"] for m in MISSIONS if m["id"] in results)
    next_id = next((m["id"] for m in MISSIONS if m["id"] not in results), None)
    if next_id is None:
        # After the first pass, revisit the task with least independent evidence.
        next_id = min(MISSIONS, key=lambda m: sum(e["independent"] for e in results[m["id"]]["evidence"]) / max(1, len(results[m["id"]]["evidence"])))["id"]
    return {"completed": completed, "xp": xp, "evidence": evidence, "recommended": next_id, "results": results}


@router.get("/bootstrap")
def bootstrap(who: str = Depends(learner)):
    return {"missions": public_missions(), "vocabulary": VOCABULARY, "progress": progress_data(who), "ai": ai_status()}


class StartRequest(BaseModel):
    mission_id: str


def run_payload(run_id, mission, state):
    return {"run_id": run_id, "mission_id": mission["id"], "index": state["index"], "revision": state["revision"], "completed": state["completed"],
            "step": None if state["completed"] else public_step(mission["steps"][state["index"]]), "steps_count": len(mission["steps"]), "evidence": state["evidence"]}


@router.post("/start")
def start(body: StartRequest, who: str = Depends(learner)):
    mission = mission_by_id(body.mission_id)
    if not mission:
        raise HTTPException(404, "没有找到这个任务。")
    index = MISSIONS.index(mission)
    if index and MISSIONS[index - 1]["id"] not in store.results(who):
        raise HTTPException(403, "先完成前一个任务，再来挑战吧。")
    run_id, state = store.start(who, mission["id"])
    return {**run_payload(run_id, mission, state), "message": "欢迎回来，我们从上次的位置继续。" if state["index"] else mission["intro"]}


class TurnRequest(BaseModel):
    run_id: str
    revision: int
    action: Literal["answer", "hint", "example", "ask"]
    answer: str = Field(default="", max_length=300)
    question: str = Field(default="", max_length=300)


@router.post("/turn")
def turn(body: TurnRequest, who: str = Depends(learner)):
    # Serialize each learner's turn, including tutoring calls. Bound lock memory.
    with _locks[hash(who) % len(_locks)]:
        now = time.monotonic()
        requests = [t for t in _requests[who] if now - t < 60]
        if len(requests) >= 30:
            raise HTTPException(429, "慢一点也没关系，请稍等再试。")
        _requests[who] = requests + [now]
        found = store.get(body.run_id, who)
        if not found:
            raise HTTPException(404, "任务记录不存在，请返回小镇重新进入。")
        mission_id, state = found
        mission = mission_by_id(mission_id)
        if state["completed"]:
            raise HTTPException(409, "这个任务已完成，请返回小镇。")
        if state["revision"] != body.revision:
            raise HTTPException(409, "任务状态已更新，请重新进入任务后继续。")
        step = mission["steps"][state["index"]]
        sid = step["id"]
        if body.action == "answer" and not body.answer.strip():
            raise HTTPException(422, "先写下或选择你的答案吧。")
        if body.action == "ask" and not body.question.strip():
            raise HTTPException(422, "先写下你想问的问题吧。")
        correct = False
        if body.action == "answer":
            state["attempts"][sid] = state["attempts"].get(sid, 0) + 1
            correct = check_answer(step, body.answer)
        elif body.action in {"hint", "example", "ask"}:
            state["hints"][sid] = state["hints"].get(sid, 0) + 1
        tutor = respond(step, state, body.action, body.answer, body.question, correct)
        if correct:
            independent = state["attempts"][sid] == 1 and not state["hints"].get(sid)
            state["evidence"].append({"step_id": sid, "skill": step["skill"], "independent": independent, "attempts": state["attempts"][sid], "hints": state["hints"].get(sid, 0)})
            state["index"] += 1
            state["completed"] = state["index"] >= len(mission["steps"])
        elif body.action == "answer":
            # Corrective feedback is help too, even without pressing the hint button.
            state["hints"][sid] = state["hints"].get(sid, 0) + 1
        if not store.save(body.run_id, who, mission_id, state, body.revision):
            raise HTTPException(409, "任务状态已更新，请重新进入后继续。")
        return {**run_payload(body.run_id, mission, state), "correct": correct, "tutor": tutor, "progress": progress_data(who)}
