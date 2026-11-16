"""Seed only Unit 1 completions in an explicitly isolated QA database."""
import json
import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = Path(os.environ["DATA_DIR"]).resolve()
if not data.is_relative_to(root / "backend") or not data.name.startswith(".qa-data-"):
    raise RuntimeError("Use an isolated backend/.qa-data-* directory.")
sys.path.insert(0,str(root / "backend"))
from app.learning_store import LearningStore
from app.curriculum import MISSIONS
store = LearningStore(data / "learning.sqlite3")
owner = "guest:" + sys.argv[1]
for mission in MISSIONS[:9]:
    run_id,state = store.start(owner,mission["id"])
    state.update(index=3,completed=True,evidence=[{"step_id":s["id"],"skill":s["skill"],"independent":True,"attempts":1,"hints":0} for s in mission["steps"]])
    store.save(run_id,owner,mission["id"],state,0)
print(json.dumps({"learner":owner}))
