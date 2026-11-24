"""Prepare the two reported steps in an isolated browser QA database."""
import os
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
directory=Path(os.environ["DATA_DIR"]).resolve()
if not directory.is_relative_to(root/"backend") or not directory.name.startswith(".qa-data-"):
    raise RuntimeError("Refusing to modify a non-QA database.")
sys.path.insert(0,str(root/"backend"))
from app.curriculum import MISSIONS,mission_by_id
from app.learning_store import LearningStore
store=LearningStore(directory/"learning.sqlite3")
who="guest:"+sys.argv[1]
for mission in MISSIONS[:11]:
    run_id,state=store.start(who,mission["id"])
    state.update(index=3,completed=True,evidence=[{"step_id":s["id"],"skill":s["skill"],"independent":True,"attempts":1,"hints":0} for s in mission["steps"]])
    store.save(run_id,who,mission["id"],state,0)
mission=mission_by_id("school-bag")
run_id,state=store.start(who,mission["id"])
state.update(index=2,evidence=[{"step_id":s["id"],"skill":s["skill"],"independent":True,"attempts":1,"hints":0} for s in mission["steps"][:2]])
store.save(run_id,who,mission["id"],state,0)
