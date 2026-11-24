"""Opt-in bounded live assessment check. Uses the existing global daily API budget."""
import argparse
import json
import sys
from pathlib import Path
from datetime import datetime, timezone
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/"backend"))
parser=argparse.ArgumentParser()
parser.add_argument("--live",action="store_true")
args=parser.parse_args()
if not args.live:
    raise SystemExit("No requests made. Pass --live to run at most three configured-provider calls.")
from app import tutor
from app.curriculum import mission_by_id
from app.ai.reading import evaluate_reading
from app.ai.writing import evaluate_writing
if not tutor.ai_status()["enabled"]:
    raise SystemExit("AI is not enabled; no requests made.")
with tutor.store.connection() as db:
    row=db.execute("SELECT calls FROM api_budget WHERE day=?",(datetime.now(timezone.utc).date().isoformat(),)).fetchone()
if (row[0] if row else 0)+3>tutor.AI_DAILY_LIMIT:
    raise SystemExit("Daily budget has fewer than three calls left; no requests made.")
cases=[
    ("school-bag","bag-location","Mein Buch liegt in meinem Schulrucksack.",True),
    ("clothing-checkout","items","Mia entscheidet sich für eine rosa Bluse und einen blauen Rock.",True),
    ("school-hello","age","Ich habe 14 Jahre alt.",False),
]
results=[]
for mid,sid,answer,expected in cases:
    item=next(s for s in mission_by_id(mid)["steps"] if s["id"]==sid)
    state={"attempts":{sid:1},"hints":{}}
    evaluate=evaluate_reading if item["mode"]=="reading" else evaluate_writing
    result=evaluate(item,state,answer,tutor.store)
    results.append({"mission":mid,"step":sid,"answer":answer,"expected":expected,
                    "correct":result["correct"],"judge":result["assessment"]["judge"],
                    "status":result["assessment"]["status"],"message":result["tutor"]["message"]})
    print(json.dumps(results[-1],ensure_ascii=False),flush=True)
target=root/"artifacts"/"assessment-live.json"
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
if not all(item["correct"]==item["expected"] and item["judge"]==tutor.AI_PROVIDER for item in results):
    raise SystemExit("Live assessment check did not meet the expected decisions; inspect artifacts/assessment-live.json.")
print("Three live judgements passed. No learner progress, answers or balances were changed.")
