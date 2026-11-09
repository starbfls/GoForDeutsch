"""One-terminal local launcher. Only loopback is exposed; no credentials in arguments."""
import os
import secrets
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import venv
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
PYTHON = BACKEND / "venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
URL = "http://127.0.0.1:8000"


def run(command, cwd):
    subprocess.run([str(part) for part in command], cwd=cwd, check=True)


def main():
    print("GoForDeutsch - preparing your adventure...", flush=True)
    if not PYTHON.is_file():
        print("Creating Python environment (first run)...", flush=True)
        venv.EnvBuilder(with_pip=True).create(BACKEND / "venv")
    check = subprocess.run([str(PYTHON), "-c", "import fastapi,uvicorn,passlib,bcrypt,jwt,pydantic,multipart"], capture_output=True)
    if check.returncode:
        print("Installing backend dependencies (internet needed on first run)...", flush=True)
        run([PYTHON, "-m", "pip", "install", "-r", "requirements.txt"], BACKEND)
    env_file = BACKEND / ".env"
    if not env_file.exists():
        template = (BACKEND / ".env.example").read_text(encoding="utf-8")
        env_file.write_text(template.replace("SECRET_KEY=", "SECRET_KEY=" + secrets.token_urlsafe(48)), encoding="utf-8")
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        raise RuntimeError("Install Node.js 22.12+ (or supported newer LTS), then run this launcher again.")
    if not (FRONTEND / "node_modules" / "vite" / "package.json").is_file():
        print("Installing frontend dependencies (internet needed on first run)...", flush=True)
        run([npm, "ci"], FRONTEND)
    index = FRONTEND / "dist" / "index.html"
    sources = [p for folder in [FRONTEND / "src", FRONTEND / "public"] for p in folder.rglob("*") if p.is_file()]
    sources += [FRONTEND / "package.json", FRONTEND / "vite.config.js", FRONTEND / "index.html"]
    if not index.exists() or any(p.stat().st_mtime > index.stat().st_mtime for p in sources):
        print("Building the learning world...", flush=True)
        run([npm, "run", "build"], FRONTEND)
    # Never open an unrelated process that happens to occupy the port.
    import socket
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", 8000)) == 0:
            raise RuntimeError("Port 8000 is already in use. Close the previous GoForDeutsch terminal or choose another port in launcher.py.")
    child = subprocess.Popen([str(PYTHON), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=BACKEND)
    try:
        ready = False
        for _ in range(80):
            if child.poll() is not None:
                raise RuntimeError("The backend did not start. Read the error above.")
            try:
                with urllib.request.urlopen(URL + "/health", timeout=.5) as response:
                    ready = response.status == 200
                if ready:
                    break
            except (urllib.error.URLError, TimeoutError, OSError):
                time.sleep(.25)
        if not ready:
            raise RuntimeError("The backend took too long to start.")
        print(f"\nOpen {URL}\nKeep this window open. Press Ctrl+C to stop.\n", flush=True)
        if "--no-browser" not in sys.argv:
            webbrowser.open(URL)
        child.wait()
    except KeyboardInterrupt:
        print("\nStopping GoForDeutsch...", flush=True)
    finally:
        if child.poll() is None:
            child.terminate()
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError) as exc:
        print(f"\nCould not start: {exc}", file=sys.stderr)
        sys.exit(1)
