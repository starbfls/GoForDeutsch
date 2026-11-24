"""One structured semantic judgement owns both writing acceptance and Mia's feedback."""
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StrictBool
from app import tutor
from app.curriculum import normalize
from .assessment_prompts import WRITING
from .local_assessment import local_assessment, local_result, writing_counts, semantic_success

class CriterionReply(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=80)
    met: StrictBool
    evidence: str = Field(max_length=160)

class WritingReply(tutor.TutorReply):
    correct: StrictBool
    language_ok: StrictBool
    criteria: list[CriterionReply] = Field(min_length=1, max_length=8)
    issues: list[Annotated[str, Field(min_length=1, max_length=160)]] = Field(max_length=3)

def evaluate_writing(step, state, answer, budget_store):
    local = local_assessment(step, answer)
    if local["correct"]:
        return local_result(step, state, answer, local)
    checks = step.get("rubric", {}).get("checks", [{"id": "task", "label": step["prompt"]}])
    required = [{"id": item["id"], "label": item["label"]} for item in checks]
    counts = writing_counts(answer)
    rubric = step.get("rubric", {})
    limits_ok = counts["sentence_count"] >= rubric.get("min_sentences", 1) and counts["word_count"] <= rubric.get("max_words", 150)
    reply, notice = tutor.request_json(WRITING, {
        "task": step["prompt"], "question": step["german"], "brief": step.get("brief"),
        "answer": answer, "reference_example": step["example"],
        "reference_alternatives": step.get("answers", []),
        "required_criteria": required,
        "length_requirements": {"min_sentences": rubric.get("min_sentences", 1), "max_words": rubric.get("max_words", 150)},
        "actual_counts": counts, "length_ok": limits_ok,
        "attempt_count": state["attempts"].get(step["id"], 0),
        "previous_help": state["hints"].get(step["id"], 0),
    }, WritingReply, budget_store)
    if reply is not None:
        expected = {item["id"] for item in required}
        actual = [item.id for item in reply.criteria]
        proof_ok = all(not item.met or (normalize(item.evidence) and normalize(item.evidence) in normalize(answer)) for item in reply.criteria)
        correct = all(item.met for item in reply.criteria) and reply.language_ok and limits_ok
        consistent = reply.correct == correct and (not correct or not reply.issues) and (correct or bool(reply.issues))
        if set(actual) == expected and len(actual) == len(expected) and proof_ok and consistent:
            assessed = {item.id: item for item in reply.criteria}
            assessment = {
                "kind": "writing" if "rubric" in step else "writing_short",
                "judge": tutor.AI_PROVIDER, "status": "correct" if correct else "incorrect",
                "criteria": [{**item, "met": assessed[item["id"]].met, "evidence": assessed[item["id"]].evidence} for item in required],
                "issues": reply.issues, "language_ok": reply.language_ok, **counts,
            }
            feedback = {key: value for key, value in reply.model_dump().items() if key in {"message", "expression", "strategy"}}
            feedback.update(source=tutor.AI_PROVIDER, notice=None, strategy="transfer" if correct else "retry")
            if correct:
                feedback = semantic_success(step, assessment, tutor.AI_PROVIDER)
            else:
                feedback["message"] = reply.issues[0]
            return {"correct": correct, "assessment": assessment, "tutor": feedback}
        notice = "AI 返回的内容检查、证据或正误不一致，本次未采用这个判断。"
    return local_result(step, state, answer, local, notice)
