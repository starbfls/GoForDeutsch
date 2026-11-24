"""Local proof and uncertainty handling shared by reading and writing assessors."""
import re
from app import tutor
from app.curriculum import assess_answer

def writing_counts(answer):
    from app.curriculum.writing import sentences
    return {
        "word_count": len(re.findall(r"[^\W_]+", answer, flags=re.UNICODE)),
        "sentence_count": len(sentences(answer)),
    }

def local_assessment(step, answer):
    result = assess_answer(step, answer)
    assessment = dict(result.get("assessment") or {})
    if step["mode"] == "writing":
        if "rubric" not in step:
            assessment.update(kind="writing_short", criteria=[{"id": "task", "label": step["prompt"], "met": result["correct"]}],
                              issues=[], **writing_counts(answer))
    assessment.update(judge="local", status="correct" if result["correct"] else "incorrect")
    # A failed whitelist match is absence of proof, not proof of a language error.
    if not result["correct"] and (
        step["mode"] == "reading" or
        ("rubric" not in step or assessment.get("unrecognized_sentences", 0) > 0)
    ):
        assessment["status"] = "unconfirmed"
    return {**result, "assessment": assessment}

def local_result(step, state, answer, result, notice=None):
    assessment = result["assessment"]
    feedback = tutor.local_reply(step, state, "answer", result["correct"], assessment, notice, answer)
    if assessment["status"] == "unconfirmed":
        feedback.update(
            message="这句暂时未能确认，不能据此判定你写错了。答案已保留，可以稍后再检查一次，或参考例句换一种表达。",
            expression="ponder", strategy="retry",
            notice=notice or "本次 AI 判题不可用，当前表达也未被本地答案库覆盖。",
        )
    return {**result, "tutor": feedback}

def semantic_success(step, assessment, provider):
    """A correct verdict must never be accompanied by an invented correction."""
    if step["mode"] == "reading":
        message = f"回答正确。这句与原文第 {assessment['focus_line']} 行的信息一致。"
    elif "rubric" in step:
        message = f"你完成了这次要求的 {len(assessment['criteria'])} 项信息，表达符合任务要求。"
    else:
        message = "这句完成了题目要求，信息和表达都正确。"
    return {"message":message,"expression":"proud","strategy":"transfer","source":provider,"notice":None}
