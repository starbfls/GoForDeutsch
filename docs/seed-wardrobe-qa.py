"""Seed enough completed tasks for an isolated shop check; never modify real data."""
import os
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
directory=Path(os.environ["DATA_DIR"]).resolve()
if not directory.is_relative_to(root/"backend") or not directory.name.startswith(".qa-data-"):
    raise RuntimeError("Use an isolated backend/.qa-data-* directory.")
sys.path.insert(0,str(root/"backend"))
from app.curriculum import MISSIONS
from app.learning_store import LearningStore
store=LearningStore(directory/"learning.sqlite3")
who="guest:"+sys.argv[1]
for mission in MISSIONS[:12]:
    run_id,state=store.start(who,mission["id"])
    state.update(index=3,completed=True,evidence=[{"step_id":s["id"],"skill":s["skill"],"independent":True,"attempts":1,"hints":0} for s in mission["steps"]])
    store.save(run_id,who,mission["id"],state,0)
