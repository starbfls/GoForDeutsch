"""Unit catalog; stable IDs preserve previous progress and review history."""
from .bakery import MISSIONS as BAKERY
from .school import MISSIONS as SCHOOL
from .park import MISSIONS as PARK
from .clothing import MISSIONS as CLOTHING
from .electronics import MISSIONS as ELECTRONICS
from .restaurant import MISSIONS as RESTAURANT
from .shopping_words import VOCABULARY as SHOPPING_WORDS
from .vocabulary import VOCABULARY as WORDS
from .answers import check_answer, normalize, assess_answer
from .units import CHAPTERS, UNITS, LESSON_TITLES, LESSON_INTROS
from .mnemonics import MEMORY

VOCABULARY = [{**word,"unit_id":"kennenlernen","mnemonic":MEMORY[word["id"]][0],"example_zh":MEMORY[word["id"]][1]} for word in WORDS]
VOCABULARY += [{**word,"unit_id":"einkaufen"} for word in SHOPPING_WORDS]
CURRENT_VERSION = 2
MISSIONS=[]
for chapter, lessons in zip(CHAPTERS, [BAKERY,PARK,SCHOOL,CLOTHING,ELECTRONICS,RESTAURANT]):
    for lesson in lessons:
        MISSIONS.append({**lesson,"title":LESSON_TITLES.get(lesson["id"],lesson["title"]),"intro":LESSON_INTROS.get(lesson["id"],lesson["intro"]),"unit_id":chapter["unit_id"],"chapter_id":chapter["id"],"chapter_number":chapter["number"],"requires":MISSIONS[-1]["id"] if MISSIONS else None})


def mission_by_id(mission_id):
    return next((mission for mission in MISSIONS if mission["id"]==mission_id),None)


def public_step(step, hint_count=0):
    private={"answer","answers","target","hints","example","explanation","rubric","clues","evidence_line"}
    public = {key:value for key,value in step.items() if key not in private}
    if step.get("mode") == "vocabulary":
        public["clues"] = step["clues"][:min(1+hint_count,len(step["clues"]))]
        public["clues_count"] = len(step["clues"])
    return public


def public_missions():
    return [{**{key:value for key,value in mission.items() if key!="steps"},"steps_count":len(mission["steps"])} for mission in MISSIONS]
