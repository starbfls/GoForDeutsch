"""Course-aware study summaries, backed by saved runs, position and coin wallet."""
from app.curriculum import CHAPTERS, MISSIONS, UNITS, mission_by_id
from app.repositories.records import LearningRecordRepository


def progress_data(store, who):
    saved = LearningRecordRepository(store).snapshot(who)
    results = {key: value for key, value in saved["results"].items() if mission_by_id(key)}
    runs = saved["runs"]
    active = {key for key, value in runs.items() if not value["state"]["completed"]}
    completed = [mission["id"] for mission in MISSIONS if mission["id"] in results]
    evidence = [item for key in completed for item in results[key]["evidence"]]
    recommended = next((mission["id"] for mission in MISSIONS if mission["id"] not in results), None)
    if recommended is None:
        recommended = min(MISSIONS, key=lambda mission: sum(item["independent"] for item in results[mission["id"]]["evidence"]) / max(1, len(results[mission["id"]]["evidence"])))["id"]
    available = [mission["id"] for mission in MISSIONS if not mission["requires"] or mission["requires"] in results or mission["id"] in results or mission["id"] in active]
    statuses = []
    for mission in MISSIONS:
        run = runs.get(mission["id"])
        done = mission["id"] in results
        state = run["state"] if run else None
        statuses.append({
            "unit_id": mission["unit_id"], "chapter_id": mission["chapter_id"], "mission_id": mission["id"],
            "chapter_number": mission["chapter_number"],
            "mission_number": next(index for index, item in enumerate([item for item in MISSIONS if item["chapter_id"] == mission["chapter_id"]], 1) if item["id"] == mission["id"]),
            "status": "completed" if done else "in_progress" if run else "not_started",
            "completed": done, "available": mission["id"] in available,
            "run_id": run["id"] if run else None, "step_index": state["index"] if state else 0,
            "steps_count": len(mission["steps"]), "created_at": run["created_at"] if run else None,
            "updated_at": run["updated_at"] if run else None,
        })
    def aggregate(entries):
        done = sum(item["completed"] for item in entries)
        return {"completed_missions": done, "total_missions": len(entries),
                "status": "completed" if entries and done == len(entries) else "in_progress" if any(item["status"] != "not_started" for item in entries) else "not_started"}
    chapters = [{**{key: scene[key] for key in ("id", "unit_id", "number")}, **aggregate([item for item in statuses if item["chapter_id"] == scene["id"]])} for scene in CHAPTERS]
    units = [{"id": unit["id"], "number": unit["number"], **aggregate([item for item in statuses if item["unit_id"] == unit["id"]])} for unit in UNITS if unit["available"]]
    position = saved["position"]
    if position:
        status = next((item for item in statuses if item["mission_id"] == position["mission_id"]), None)
        if status:
            position = {**position, "completed": bool(position["completed"]),
                        "unit_number": next(unit["number"] for unit in UNITS if unit["id"] == position["unit_id"]),
                        "chapter_number": status["chapter_number"], "mission_number": status["mission_number"],
                        "step_number": min(position["step_index"] + 1, status["steps_count"])}
    return {"completed": completed, "coins": saved["wallet"]["balance"], "earned_coins":saved["wallet"]["total_earned"], "spent_coins":saved["wallet"]["total_spent"], "xp": saved["wallet"]["balance"], "earned_xp": saved["wallet"]["total_earned"],
            "wallet": saved["wallet"], "evidence": evidence, "recommended": recommended, "results": results,
            "total_missions": len(MISSIONS), "available": available, "current": position,
            "mission_statuses": statuses, "chapters": chapters, "units": units}
