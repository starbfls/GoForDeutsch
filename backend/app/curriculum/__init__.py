"""Unit catalog; stable IDs preserve previous progress and review history."""
from .bakery import MISSIONS as BAKERY
from .school import MISSIONS as SCHOOL
from .park import MISSIONS as PARK
from .vocabulary import VOCABULARY as WORDS
from .answers import check_answer, normalize
from .units import CHAPTERS, UNITS, LESSON_TITLES, LESSON_INTROS
from .mnemonics import MEMORY

VOCABULARY = [{**word,"unit_id":"kennenlernen","mnemonic":MEMORY[word["id"]][0],"example_zh":MEMORY[word["id"]][1]} for word in WORDS]
MISSIONS=[]
for chapter, lessons in zip(CHAPTERS, [BAKERY,PARK,SCHOOL]):
    for lesson in lessons:
        MISSIONS.append({**lesson,"title":LESSON_TITLES[lesson["id"]],"intro":LESSON_INTROS[lesson["id"]],"unit_id":chapter["unit_id"],"chapter_id":chapter["id"],"chapter_number":chapter["number"],"requires":MISSIONS[-1]["id"] if MISSIONS else None})


def mission_by_id(mission_id):
    return next((mission for mission in MISSIONS if mission["id"]==mission_id),None)


def public_step(step):
    private={"answer","answers","target","hints","example","explanation"}
    return {key:value for key,value in step.items() if key not in private}


def public_missions():
    return [{**{key:value for key,value in mission.items() if key!="steps"},"steps_count":len(mission["steps"])} for mission in MISSIONS]
