"""Isolated HTTP check for account-bound study history and persisted coins; no paid AI."""
import json
import uuid
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))
from app.curriculum import MISSIONS


def main():
    with tempfile.TemporaryDirectory(prefix=".qa-data-http-records-", dir=BACKEND) as temporary:
        directory = Path(temporary)
        assert directory.resolve().is_relative_to(BACKEND)
        environment = {
            **os.environ, "DATA_DIR": str(directory), "AI_ENABLED": "false",
            "SECRET_KEY": "isolated-learning-records-http-test-only", "PYTHONDONTWRITEBYTECODE": "1",
        }
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        base = f"http://127.0.0.1:{port}"
        process = None
        log = (directory / "server.log").open("w+", encoding="utf-8")

        def request(path, body=None, token=None, expected=200, method=None):
            headers = {"Content-Type": "application/json", "X-Learner-ID": "10000000-0000-4000-8000-000000000001"}
            if token:
                headers["Authorization"] = "Bearer " + token
            req = urllib.request.Request(base + path, data=json.dumps(body).encode("utf-8") if body is not None else None, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=5) as response:
                    status, data = response.status, json.load(response)
            except urllib.error.HTTPError as error:
                status, data = error.code, json.load(error)
            assert status == expected, (path, status, expected)
            return data

        def launch():
            server = subprocess.Popen(
                [sys.executable, "-B", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
                cwd=BACKEND, env=environment, stdout=log, stderr=subprocess.STDOUT,
            )
            for _ in range(100):
                if server.poll() is not None:
                    raise RuntimeError("Isolated server stopped unexpectedly.")
                try:
                    request("/health")
                    return server
                except (OSError, urllib.error.URLError):
                    time.sleep(.1)
            server.terminate()
            server.wait(timeout=5)
            raise RuntimeError("Isolated server did not become ready.")

        def stop(server):
            if server is None:
                return
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)

        try:
            process = launch()
            a = request("/api/auth/register", {"password": "RecordTestPassword2026"}, expected=201)
            b = request("/api/auth/register", {"password": "OtherTestPassword2026"}, expected=201)
            token_a, token_b = a["access_token"], b["access_token"]
            original_id = request("/api/auth/me", token=token_a)["id"]
            initial = request("/api/learning/progress", token=token_a)
            assert initial["current"] is None and initial["xp"] == 0
            assert all(item["status"] == "not_started" for item in initial["mission_statuses"])
            assert request("/api/flashcards", token=token_a)["cards"] == []
            request("/api/flashcards/collect", {"card_ids":["bakery-1"]}, token_a, expected=403)
            run = request("/api/learning/start", {"mission_id": "bakery-first"}, token_a)
            original_run = dict(run)
            assert run["progress"]["current"]["mission_number"] == 1
            raw = "  Ich möchte kein Brot? 原文测试  "
            run = request("/api/learning/turn", {"run_id": run["run_id"], "revision": run["revision"], "action": "answer", "answer": raw}, token_a)
            assert not run["correct"]
            request("/api/learning/turn", {"run_id": original_run["run_id"], "revision": original_run["revision"], "action": "answer", "answer": raw}, token_a, expected=409)
            request("/api/learning/turn", {"run_id": run["run_id"], "revision": run["revision"], "action": "answer", "answer": raw}, token_b, expected=404)
            question = "为什么这里要用 das？"
            run = request("/api/learning/turn", {"run_id": run["run_id"], "revision": run["revision"], "action": "ask", "question": question}, token_a)
            history = request("/api/learning/history", token=token_a)
            assert history["items"][1]["answer"] == raw
            assert history["items"][0]["question"] == question
            assert request("/api/learning/history?learner=user:" + original_id, token=token_b)["items"] == []
            assert request("/api/learning/wallet", token=token_b)["balance"] == 0
            for _ in range(2):
                run = request("/api/learning/start", {"mission_id": "bakery-first"}, token_a)
                while not run["completed"]:
                    step = MISSIONS[0]["steps"][run["index"]]
                    answer = step.get("answer", step.get("example", ""))
                    run = request("/api/learning/turn", {
                        "run_id": run["run_id"], "revision": run["revision"], "action": "answer",
                        "answer": answer, "xp": 999999, "balance": 999999,
                    }, token_a)
            assert request("/api/flashcards", token=token_a)["cards"] == []
            choices = request("/api/flashcards/candidates?mission_id=bakery-first", token=token_a)
            assert len(choices["cards"]) == 4
            assert request("/api/flashcards/collect", {"card_ids":["bakery-1"]}, token_a)["added_count"] == 1
            assert request("/api/flashcards/collect", {"card_ids":["bakery-1"]}, token_a)["added_count"] == 0
            request("/api/flashcards/collect", {"card_ids":["bakery-1"]}, token_b, expected=403)
            request("/api/flashcards/collect", {"card_ids":["bakery-1"],"learner":"forged"}, token_a, expected=422)
            assert request("/api/flashcards", token=token_b)["cards"] == []
            request("/api/flashcards/review", {"card_id":"bakery-1","rating":"good","review_id":str(uuid.uuid4())}, token_a)
            balance = request("/api/learning/wallet", token=token_a)
            assert balance == {"currency": "COIN", "balance": 40, "total_earned": 40, "total_spent": 0}
            assert len(request("/api/learning/wallet/transactions", token=token_a)["items"]) == 1
            assert len(request("/api/learning/history", token=token_a)["items"]) == 8
            page = request("/api/learning/history?limit=2", token=token_a)
            page2 = request("/api/learning/history?limit=2&before=" + str(page["next_before"]), token=token_a)
            assert page["items"][-1]["seq"] > page2["items"][0]["seq"]
            request("/api/learning/history?limit=101", token=token_a, expected=422)
            request("/api/learning/wallet", {"balance": 999999}, token_a, expected=405)
            final = request("/api/learning/progress", token=token_a)
            assert final["current"]["completed"]
            assert final["mission_statuses"][0]["status"] == "completed"
            assert final["mission_statuses"][1]["status"] == "not_started"
            stop(process)
            process = launch()
            signed_in = request("/api/auth/login", {"username": a["username"], "password": "RecordTestPassword2026"})
            token_a = signed_in["access_token"]
            assert request("/api/auth/me", token=token_a)["id"] == original_id
            assert request("/api/learning/progress", token=token_a)["current"]["run_id"] == final["current"]["run_id"]
            assert request("/api/learning/wallet", token=token_a)["balance"] == 40
            restored_cards = request("/api/flashcards", token=token_a)["cards"]
            assert len(restored_cards) == 1 and restored_cards[0]["review"]["reviews"] == 1
            assert len(request("/api/learning/history", token=token_a)["items"]) == 8
            assert request("/api/learning/history", token=token_b)["items"] == []
            stop(process)
            process = None
            log.flush()
            log.seek(0)
            assert "Traceback" not in log.read()
            print("HTTP checks passed: account isolation, exact answers/questions, statuses, current position, bounded history pages, one reward across replays, rejected balance writes, explicit flashcard collection, and login/server-restart persistence.")
        finally:
            stop(process)
            log.close()


if __name__ == "__main__":
    main()
