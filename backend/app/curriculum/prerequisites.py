"""Server-owned availability, including the boundary between units."""
from . import MISSIONS

def available(mission, completed, active=()):
    if mission["id"] in completed or mission["id"] in active:
        return True
    if mission["id"] == "clothing-labels" and any(item["id"] not in completed for item in MISSIONS if item["unit_id"]=="kennenlernen"):
        return False
    return not mission["requires"] or mission["requires"] in completed
