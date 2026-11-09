from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import auth as auth_router
from app.routers import learning as learning_router

app = FastAPI(
    title="GoForDeutsch API",
    description="Backend for the GoForDeutsch German learning platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(learning_router.router)
app.include_router(auth_router.router, prefix="/api")
app.include_router(learning_router.router, prefix="/api")

FRONTEND = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if (FRONTEND / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND / "assets"), name="assets")


@app.get("/")
def root():
    if (FRONTEND / "index.html").is_file():
        return FileResponse(FRONTEND / "index.html")
    return {"message": "GoForDeutsch API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/{path:path}", include_in_schema=False)
def frontend_route(path: str):
    if path.startswith(("api/", "auth/", "learning/")):
        raise HTTPException(404, "Not found")
    if path == "favicon.svg" and (FRONTEND / "favicon.svg").is_file():
        return FileResponse(FRONTEND / "favicon.svg")
    if "." not in path and (FRONTEND / "index.html").is_file():
        return FileResponse(FRONTEND / "index.html")
    raise HTTPException(404, "Not found")
