"""Reviewed answer normalization and matching; no substring scoring."""
import re
import unicodedata

def normalize(text):
    text = unicodedata.normalize("NFKC", text).lower().replace("ö", "oe").replace("ü", "ue").replace("ä", "ae").replace("ß", "ss")
    return " ".join(re.sub(r"[^a-z0-9\s]", " ", text).split())


def check_answer(step, answer):
    if "rubric" in step:
        from .writing import assess_writing
        return assess_writing(step, answer)["correct"]
    value = normalize(answer)
    if step["type"] == "choice":
        return value == step["answer"]
    if step["type"] == "tiles":
        return value in {normalize(a) for a in step["answers"]}
    if "answers" in step:
        if value in {normalize(item) for item in step["answers"]}:
            return True
        if step.get("mode") == "reading" and normalize(step.get("example","")).endswith("euro"):
            amounts = {"ein":1,"einen":1,"eins":1,"1":1,"zwei":2,"2":2,"vier":4,"4":4,"fuenf":5,"5":5,"vierundzwanzig":24,"24":24,"sechsundzwanzig":26,"26":26,"fuenfunddreissig":35,"35":35,"fuenfzig":50,"50":50}
            expected = amounts.get(normalize(step["example"]).split()[0])
            match = re.fullmatch(r"(?:(?:(?:es|das|alles|das essen|ein broetchen|die bestellung|die bluse|der rock|die jacke) kostet|das macht|es sind|das sind|zusammen|insgesamt) )?(ein|einen|eins|1|zwei|2|vier|4|fuenf|5|vierundzwanzig|24|sechsundzwanzig|26|fuenfunddreissig|35|fuenfzig|50)(?: euro)?(?: bitte)?", value)
            return bool(match and expected is not None and amounts[match[1]] == expected)
        return False
    products = {"roll": "ein broetchen", "pretzel": "eine brezel", "two-rolls": "zwei broetchen", "bread": "ein brot"}
    noun = products[step["target"]]
    # Accept reviewed natural alternatives, not substring matches that accept negatives.
    variants = [noun, f"{noun} bitte", f"bitte {noun}"]
    for prefix in ["ich moechte", "ich haette gern", "ich haette gerne", "ich nehme"]:
        variants.extend([f"{prefix} {noun}", f"{prefix} {noun} bitte", f"{prefix} bitte {noun}"])
    for greeting in ["", "guten tag ", "hallo "]:
        if value in {greeting + v for v in variants}:
            return True
    return False




def assess_answer(step, answer):
    if "rubric" in step:
        from .writing import assess_writing
        return assess_writing(step, answer)
    correct = check_answer(step, answer)
    assessment = None
    if step.get("mode") == "reading":
        line = step["evidence_line"]
        assessment = {"kind":"reading","focus_line":line}
        if correct:
            assessment["evidence"] = step["passage"]["lines"][line-1]
    elif step.get("mode") == "vocabulary":
        assessment = {"kind":"vocabulary"}
        if correct:
            assessment["word"] = step["example"]
    return {"correct":correct,"assessment":assessment}
