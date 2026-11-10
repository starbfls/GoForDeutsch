"""Task execution, evidence and reward rules, independent of HTTP routing."""
import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException
from app.curriculum import MISSIONS, check_answer, mission_by_id, public_step
from app.tutor import respond

_locks = [Lock() for _ in range(64)]
_requests = defaultdict(list)

def progress_data(store, who):
    results = {key:value for key,value in store.results(who).items() if mission_by_id(key)}
    active = store.active_missions(who)
    completed = list(results)
    evidence = [item for result in results.values() for item in result["evidence"]]
    xp = sum(m["xp"] for m in MISSIONS if m["id"] in results)
    next_id = next((m["id"] for m in MISSIONS if m["id"] not in results), None)
    if next_id is None:
        # After the first pass, revisit the task with least independent evidence.
        next_id = min(MISSIONS, key=lambda m: sum(e["independent"] for e in results[m["id"]]["evidence"]) / max(1, len(results[m["id"]]["evidence"])))["id"]
    return {"completed": completed, "xp": xp, "evidence": evidence, "recommended": next_id, "results": results, "total_missions": len(MISSIONS), "available": [m["id"] for m in MISSIONS if not m["requires"] or m["requires"] in results or m["id"] in results or m["id"] in active]}


def run_payload(run_id, mission, state):
    return {"run_id": run_id, "mission_id": mission["id"], "chapter_id": mission["chapter_id"], "index": state["index"], "revision": state["revision"], "completed": state["completed"],
            "step": None if state["completed"] else public_step(mission["steps"][state["index"]]), "steps_count": len(mission["steps"]), "evidence": state["evidence"]}


def start_run(store, mission_id, who):
    mission = mission_by_id(mission_id)
    if not mission:
        raise HTTPException(404, "没有找到这个任务。")
    index = MISSIONS.index(mission)
    if index and MISSIONS[index - 1]["id"] not in store.results(who) and mission_id not in store.results(who) and mission_id not in store.active_missions(who):
        raise HTTPException(403, "先完成前一个任务，再来挑战吧。")
    run_id, state = store.start(who, mission["id"])
    return {**run_payload(run_id, mission, state), "message": "欢迎回来，我们从上次的位置继续。" if state["index"] else mission["intro"]}


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
        return {**run_payload(body.run_id, mission, state), "correct": correct, "tutor": tutor, "progress": progress_data(store, who)}
