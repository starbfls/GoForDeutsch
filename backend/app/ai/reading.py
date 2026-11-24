"""Local verified answers first; one semantic reading call for other expressions."""
from pydantic import StrictBool, StrictInt
from app import tutor
from .assessment_prompts import READING
from .local_assessment import local_assessment, local_result, semantic_success

class ReadingReply(tutor.TutorReply):
    correct: StrictBool
    evidence_line: StrictInt

INSTRUCTIONS = READING

def evaluate_reading(step, state, answer, budget_store):
    local = local_assessment(step, answer)
    if local["correct"]:
        return local_result(step, state, answer, local)
    reply, notice = tutor.request_json(INSTRUCTIONS, {
        "passage": step["passage"], "question": step["german"], "task": step["prompt"],
        "answer": answer, "reference_example": step["example"],
        "reference_alternatives": step.get("answers", []),
        "attempt_count": state["attempts"].get(step["id"], 0),
        "previous_help": state["hints"].get(step["id"], 0),
    }, ReadingReply, budget_store)
    if reply is not None and 1 <= reply.evidence_line <= len(step["passage"]["lines"]):
        assessment = {"kind": "reading", "focus_line": reply.evidence_line, "judge": tutor.AI_PROVIDER,
                      "status": "correct" if reply.correct else "incorrect"}
        if reply.correct:
            assessment["evidence"] = step["passage"]["lines"][reply.evidence_line-1]
        feedback = {key: value for key, value in reply.model_dump().items() if key in {"message", "expression", "strategy"}}
        feedback.update(source=tutor.AI_PROVIDER, notice=None, strategy="transfer" if reply.correct else "retry")
        if reply.correct:
            feedback = semantic_success(step, assessment, tutor.AI_PROVIDER)
        return {"correct": reply.correct, "assessment": assessment, "tutor": feedback}
    if reply is not None:
        notice = "AI 返回的原文位置无法确认，本次未采用这个判断。"
    return local_result(step, state, answer, local, notice)
