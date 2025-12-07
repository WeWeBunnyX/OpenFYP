
"""Minimal FastAPI bootstrap.

This module only creates the FastAPI application, includes routers defined in
`routes_registrations` and `routes_scheduling_evaluation`, and performs a few
lightweight startup tasks (create DB tables, ensure upload directory, seed demo
users). All route implementations live in the `routes_*.py` modules.
"""

import os
from pathlib import Path
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select

from .models import engine, User
from .routes_registrations import router as registrations_router
from .routes_scheduling_evaluation import router as scheduling_router


APP_TITLE = os.getenv("APP_TITLE", "OpenFYP Backend")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./backend/uploads")


app = FastAPI(title=APP_TITLE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Backend is working!"}


app.include_router(registrations_router)
app.include_router(scheduling_router)


@app.on_event("startup")
def on_startup():
    # Ensure upload directory exists
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    # Create DB tables if missing
    SQLModel.metadata.create_all(engine)

    # Seed a few demo users if they do not exist (for development)
    demo_users = [
        {"email": "student@example.com", "password": "student", "role": "Student", "name": "Demo Student"},
        {"email": "supervisor@example.com", "password": "supervisor", "role": "Supervisor", "name": "Demo Supervisor"},
        {"email": "coordinator@example.com", "password": "coordinator", "role": "Coordinator", "name": "Demo Coordinator"},
    ]

    try:
        with Session(engine) as session:
            for du in demo_users:
                existing = session.get(User, du["email"])
                if not existing:
                    session.add(User(**du))
            session.commit()
    except Exception:
        # best-effort only; do not crash startup on seed failure
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
