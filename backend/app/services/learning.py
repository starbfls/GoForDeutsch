"""Task execution, evidence and reward rules, independent of HTTP routing."""
import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException
from app.curriculum import MISSIONS, assess_answer, mission_by_id, public_step
from app.tutor import respond
from app.curriculum import CURRENT_VERSION
from app.services.progress import progress_data
from app.ai.reading import evaluate_reading
from app.services.card_collection import candidates
from app.curriculum.card_links import GUESS_CARDS
from app.curriculum.prerequisites import available

_locks = [Lock() for _ in range(64)]
_requests = defaultdict(list)

def run_payload(run_id, mission, state):
    return {"run_id": run_id, "mission_id": mission["id"], "chapter_id": mission["chapter_id"], "index": state["index"], "revision": state["revision"], "completed": state["completed"],
            "step": None if state["completed"] else public_step(mission["steps"][state["index"]], state["hints"].get(mission["steps"][state["index"]]["id"],0)), "steps_count": len(mission["steps"]), "evidence": state["evidence"], "mode":mission["mode"], "reward_coins":state.get("reward_coins",0), "curriculum_version":state.get("curriculum_version",1)}


def start_run(store, mission_id, who):
    mission = mission_by_id(mission_id)
    if not mission:
        raise HTTPException(404, "没有找到这个任务。")
    if not available(mission, store.results(who), store.active_missions(who)):
        raise HTTPException(403, "先完成前一个任务，再来挑战吧。")
    run_id, state = store.start(who, mission["id"])
    return {**run_payload(run_id, mission, state), "progress": progress_data(store, who), "message": "欢迎回来，我们从上次的位置继续。" if state["index"] else mission["intro"]}


def submit_turn(store, body, who):
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
        if not mission:
            raise HTTPException(404, "这条练习已不在当前课程中。")
        if state.get("curriculum_version",1) < CURRENT_VERSION:
            raise HTTPException(409,"课程已更新，请重新进入练习，从新版第一题开始。")
        step_index = state["index"]
        step = mission["steps"][step_index]
        sid = step["id"]
        if body.action == "answer" and not body.answer.strip():
            raise HTTPException(422, "先写下或选择你的答案吧。")
        if body.action == "ask" and not body.question.strip():
            raise HTTPException(422, "先写下你想问的问题吧。")
        correct = False
        assessment = None
        judged_tutor = None
        if body.action == "answer":
            state["attempts"][sid] = state["attempts"].get(sid, 0) + 1
            if len(body.answer) > step.get("max_length",300):
                raise HTTPException(422,"回答过长，请围绕当前问题简短作答。")
            evaluation = evaluate_reading(step, state, body.answer, store) if step.get("mode") == "reading" else assess_answer(step, body.answer)
            judged_tutor = evaluation.get("tutor")
            correct, assessment = evaluation["correct"], evaluation["assessment"]
        elif body.action in {"hint", "example", "ask"}:
            state["hints"][sid] = state["hints"].get(sid, 0) + 1
        tutor = judged_tutor or respond(step, state, body.action, body.answer, body.question, correct, assessment)
        if correct:
            independent = state["attempts"][sid] == 1 and not state["hints"].get(sid)
            state["evidence"].append({"step_id": sid, "skill": step["skill"], "independent": independent, "attempts": state["attempts"][sid], "hints": state["hints"].get(sid, 0)})
            state["index"] += 1
            state["completed"] = state["index"] >= len(mission["steps"])
        elif body.action == "answer":
            # Corrective feedback is help too, even without pressing the hint button.
            state["hints"][sid] = state["hints"].get(sid, 0) + 1
        event = {
            "step_id": sid, "step_index": step_index, "action": body.action,
            "answer": body.answer if body.action == "answer" else "",
            "question": body.question if body.action == "ask" else "",
            "correct": correct if body.action == "answer" else None,
            "attempt_count": state["attempts"].get(sid, 0), "hint_count": state["hints"].get(sid, 0),
            "feedback": {**tutor,"assessment":assessment},
        }
        if not store.save(body.run_id, who, mission_id, state, body.revision, event=event):
            raise HTTPException(409, "任务状态已更新，请重新进入后继续。")
        offers = []
        if correct and step.get("mode") == "vocabulary":
            cid = GUESS_CARDS.get((mission_id, sid))
            if cid:
                offers = candidates(store, who, only_ids=[cid])
        completed_cards = candidates(store, who, mission_id) if state["completed"] else []
        return {"collection_offer":offers,"collection_candidates":completed_cards, **run_payload(body.run_id, mission, state), "correct": correct, "assessment":assessment, "tutor": tutor, "progress": progress_data(store, who)}
