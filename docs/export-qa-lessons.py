"""Export authored lesson answers for local browser QA only."""
import os
import json
import sys
from pathlib import Path

root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
from app.curriculum import MISSIONS,normalize
from app.curriculum.card_links import MISSION_CARDS, GUESS_CARDS

fixtures=[]
for mission in MISSIONS:
    if mission["unit_id"] != os.environ.get("GFD_QA_UNIT", "kennenlernen"): continue
    steps=[]
    for step in mission['steps']:
        entry={'id':step['id'],'type':step['type'],'card_id':GUESS_CARDS.get((mission['id'],step['id']))}
        if step['type']=='choice':
            entry['choice']=next(i for i,option in enumerate(step['options']) if option['id']==step['answer'])
        elif step['type']=='tiles':
            pool=list(enumerate(step['tiles']))
            entry['tiles']=[]
            for word in normalize(step['answers'][0]).split():
                index=next(i for i,tile in pool if normalize(tile)==word)
                entry['tiles'].append(index)
                pool=[(i,tile) for i,tile in pool if i!=index]
        else:
            entry['answer']=step['example']
        steps.append(entry)
    fixtures.append({'id':mission['id'],'chapter':mission['chapter_id'],'steps':steps,'card_ids':MISSION_CARDS[mission['id']]})
print(json.dumps(fixtures))
