"""Export authored lesson answers for local browser QA only."""
import json
import sys
from pathlib import Path

root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
from app.curriculum import MISSIONS,normalize

fixtures=[]
for mission in MISSIONS:
    steps=[]
    for step in mission['steps']:
        entry={'id':step['id'],'type':step['type']}
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
    fixtures.append({'id':mission['id'],'chapter':mission['chapter_id'],'steps':steps})
print(json.dumps(fixtures))
