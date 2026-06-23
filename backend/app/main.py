from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth as auth_router

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


@app.get("/")
def root():
    return {"message": "GoForDeutsch API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
