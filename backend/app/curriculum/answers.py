"""Reviewed answer normalization and matching; no substring scoring."""
import re
import unicodedata

def normalize(text):
    text = unicodedata.normalize("NFKC", text).lower().replace("ö", "oe").replace("ü", "ue").replace("ä", "ae").replace("ß", "ss")
    return " ".join(re.sub(r"[^a-z0-9\s]", " ", text).split())


def check_answer(step, answer):
    value = normalize(answer)
    if step["type"] == "choice":
        return value == step["answer"]
    if step["type"] == "tiles":
        return value in {normalize(a) for a in step["answers"]}
    if "answers" in step:
        return value in {normalize(item) for item in step["answers"]}
    products = {"roll": "ein broetchen", "pretzel": "eine brezel", "two-rolls": "zwei broetchen", "bread": "ein brot"}
    noun = products[step["target"]]
    # Accept reviewed natural alternatives, not substring matches that accept negatives.
    variants = [f"{noun} bitte", f"bitte {noun}"]
    for prefix in ["ich moechte", "ich haette gern", "ich haette gerne", "ich nehme"]:
        variants.extend([f"{prefix} {noun} bitte", f"{prefix} bitte {noun}"])
    for greeting in ["", "guten tag ", "hallo "]:
        if value in {greeting + v for v in variants}:
            return True
    return False


