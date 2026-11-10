"""Small transparent review schedule; this is not a validated mastery model."""
from datetime import datetime, timedelta, timezone


def initial_state(now=None):
    now = now or datetime.now(timezone.utc)
    return {"reviews":0,"lapses":0,"interval_days":0,"due_at":now.isoformat(),"favorite":False,"last_rating":None}


def schedule(previous, rating, now=None):
    now = now or datetime.now(timezone.utc)
    state = {**initial_state(now), **previous}
    interval = state["interval_days"]
    if rating == "again":
        duration = timedelta(minutes=10)
        state["lapses"] += 1
    elif rating == "hard":
        duration = timedelta(days=max(1, interval * 1.2))
    elif rating == "good":
        duration = timedelta(days=max(3, interval * 2))
    elif rating == "easy":
        duration = timedelta(days=max(7, interval * 3))
    else:
        raise ValueError("Unknown review rating")
    state.update(reviews=state["reviews"]+1, interval_days=duration.total_seconds()/86400,
                 due_at=(now+duration).isoformat(),last_rating=rating)
    return state


def is_due(state, now=None):
    now = now or datetime.now(timezone.utc)
    return datetime.fromisoformat(state["due_at"]) <= now
