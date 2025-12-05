"""
Database backend using SQLModel. Replaces in memory demo stores with real tables.
Tables are created on startup if they do not exist. Use DATABASE_URL env var to point to Postgres
or SQLite for quick testing.

export DATABASE_URL='postgresql+psycopg2://openfyp:password@localhost:5432/fypdb'--> using as default (overriden via docker-compose.yml)

export DATABASE_URL='sqlite:///./backend/dev.db'-->  fallback to sqlite localdb only if above not set

"""

from typing import List, Optional
import os
from datetime import datetime
from fastapi import FastAPI, Response, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select
from sqlalchemy import Column, JSON

#Overriden by docker-compose.yml to point to Openfyp container (Backend + Db)->(openfyp-backend + postgres:15)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/dev.db")
print("Using DATABASE_URL:", DATABASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


engine = create_engine(DATABASE_URL, echo=False)


class User(SQLModel, table=True):
    email: str = Field(primary_key=True)
    password: str
    role: str
    name: Optional[str] = None


class Registration(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner: str
    title: str
    supervisor: str
    abstract: Optional[str] = None
    status: str = Field(default="pending_approval")
    history: List[dict] = Field(sa_column=Column(JSON), default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_email: str
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = Field(default=False)


def get_session():
    with Session(engine) as session:
        yield session


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    # seed demo users if none exist
    with Session(engine) as session:
        existing = session.exec(select(User)).first()
        if not existing:
            demo = [
                User(email="test@example.com", password="password", role="Student", name="Test Student"),
                User(email="supervisor@example.com", password="password", role="Supervisor", name="Dr. Supervisor"),
                User(email="supervisor@test.com", password="password", role="Supervisor", name="Supervisor Test"),
                User(email="coordinator@example.com", password="password", role="Coordinator", name="Coordinator"),
            ]
            session.add_all(demo)
            session.commit()


def push_notification_db(session: Session, email: str, message: str):
    if not email:
        return
    note = Notification(user_email=email, message=message)
    session.add(note)


@app.get("/")
def read_root():
    return {"message": "Backend is working!"}


@app.post("/login")
def login(data: dict, response: Response, session: Session = Depends(get_session)):
    email = data.get("email")
    password = data.get("password")
    user = session.get(User, email)
    if user and user.password == password:
        return {"message": "Login successful", "user": {"email": user.email, "name": user.name, "role": user.role}}

    response.status_code = status.HTTP_401_UNAUTHORIZED
    return {"message": "Invalid credentials"}


@app.post("/registrations")
def create_registration(data: dict, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Student":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only students can submit registrations"}

    supervisor_email = data.get("supervisor")
    supervisor = session.get(User, supervisor_email)
    if not supervisor or supervisor.role != "Supervisor":
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Supervisor not found"}

    reg = Registration(owner=x_user_email, title=data.get("title"), supervisor=supervisor_email, abstract=data.get("abstract"), history=[{"actor": x_user_email, "action": "submitted", "note": "Student submitted registration", "at": datetime.utcnow().isoformat()}])
    session.add(reg)
    session.commit()
    session.refresh(reg)

    push_notification_db(session, supervisor_email, f"New registration submitted by {x_user_email}: {reg.title}")
    # notify coordinators
    coords = session.exec(select(User).where(User.role == "Coordinator")).all()
    for c in coords:
        push_notification_db(session, c.email, f"Registration submitted by {x_user_email}: {reg.title}")

    session.commit()
    return {"message": "Submitted", "registration": reg.dict()}


@app.get("/registrations")
def list_registrations(x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return {"registrations": []}
    role = user.role
    if role == "Supervisor":
        regs = session.exec(select(Registration).where(Registration.status == "pending_approval", Registration.supervisor == x_user_email)).all()
        return {"registrations": [r.dict() for r in regs]}
    if role == "Coordinator":
        regs = session.exec(select(Registration)).all()
        return {"registrations": [r.dict() for r in regs]}
    if role == "Student":
        regs = session.exec(select(Registration).where(Registration.owner == x_user_email)).all()
        return {"registrations": [r.dict() for r in regs]}
    return {"registrations": []}


@app.get("/notifications")
def get_notifications(x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    if not x_user_email:
        return {"notifications": []}
    notes = session.exec(select(Notification).where(Notification.user_email == x_user_email)).all()
    return {"notifications": [{"id": n.id, "message": n.message, "created_at": n.created_at.isoformat(), "read": n.read} for n in notes]}


@app.patch("/registrations/{reg_id}/approve")
def approve_registration(reg_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Supervisor":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only supervisors can approve"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    reg.status = "approved"
    reg.history = reg.history or []
    reg.history.append({"actor": x_user_email, "action": "approved", "note": "Supervisor approved", "at": datetime.utcnow().isoformat()})
    session.add(reg)
    push_notification_db(session, reg.owner, f"Your registration '{reg.title}' was approved by {x_user_email}")
    coords = session.exec(select(User).where(User.role == "Coordinator")).all()
    for c in coords:
        push_notification_db(session, c.email, f"Registration '{reg.title}' approved by supervisor {x_user_email}")

    session.commit()
    session.refresh(reg)
    return {"message": "Approved", "registration": reg.dict()}


@app.patch("/registrations/{reg_id}/reject")
def reject_registration(reg_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Supervisor":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only supervisors can reject"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    reg.status = "rejected"
    reg.history = reg.history or []
    reg.history.append({"actor": x_user_email, "action": "rejected", "note": "Supervisor rejected", "at": datetime.utcnow().isoformat()})
    session.add(reg)
    push_notification_db(session, reg.owner, f"Your registration '{reg.title}' was rejected by {x_user_email}")
    session.commit()
    session.refresh(reg)
    return {"message": "Rejected", "registration": reg.dict()}


@app.patch("/registrations/{reg_id}/verify")
def verify_registration(reg_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can verify"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    reg.status = "registered"
    reg.history = reg.history or []
    reg.history.append({"actor": x_user_email, "action": "verified", "note": "Coordinator verified (registered)", "at": datetime.utcnow().isoformat()})
    session.add(reg)
    push_notification_db(session, reg.owner, f"Your registration '{reg.title}' was verified by coordinator {x_user_email}")
    session.commit()
    session.refresh(reg)
    return {"message": "Verified", "registration": reg.dict()}


@app.post("/schedule")
def create_schedule(
        data: dict,
        response: Response,
        x_user_email: str = Header(None, alias="X-User-Email"),
        session: Session = Depends(get_session)
):
    """
    Schedule defense for registrations.
    Payload: {
      "start": "2024-01-01T10:00:00Z",
      "end": "2024-01-01T11:00:00Z",
      "slot_minutes": 30,
      "committee_pool": ["a@example.com", "b@example.com"],
      "registration_ids": [1, 2]
    }
    """
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can schedule"}

    start = data.get("start")
    committee_pool = data.get("committee_pool") or []
    reg_ids = data.get("registration_ids") or []

    if not start or not committee_pool or not reg_ids:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Missing start, committee_pool or registration_ids"}

    # Process each registration
    for rid in reg_ids:
        reg = session.get(Registration, rid)
        if not reg:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"message": f"Registration {rid} not found"}

        # Add history entry
        reg.history = reg.history or []
        reg.history.append({
            "actor": x_user_email,
            "action": "scheduled",
            "note": f"Defense scheduled for {start}",
            "at": datetime.utcnow().isoformat()
        })
        session.add(reg)

        # Notify student
        push_notification_db(
            session,
            reg.owner,
            f"Your defense for '{reg.title}' scheduled on {start} — Committee: {', '.join(committee_pool)}"
        )

        # Notify committee members
        for email in committee_pool:
            push_notification_db(
                session,
                email,
                f"You are assigned to defense for '{reg.title}' on {start}"
            )

    session.commit()
    return {"message": "Scheduled successfully"}
