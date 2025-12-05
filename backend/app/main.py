"""
Database backend using SQLModel. Replaces in memory demo stores with real tables.
Tables are created on startup if they do not exist. Use DATABASE_URL env var to point to Postgres
or SQLite for quick testing.

export DATABASE_URL='postgresql+psycopg2://openfyp:password@localhost:5432/fypdb'--> using as default (overriden via docker-compose.yml)

export DATABASE_URL='sqlite:///./backend/dev.db'-->  fallback to sqlite localdb only if above not set

"""

from typing import List, Optional
import base64
import uuid
from pathlib import Path
import mimetypes
import os
from datetime import datetime

from fastapi import FastAPI, Response, status, Header, Depends, Body
from fastapi.responses import FileResponse
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
    remarks: Optional[str] = None
    status: str = Field(default="pending_approval")
    history: List[dict] = Field(sa_column=Column(JSON), default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Attachment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    registration_id: int
    filename: str
    filepath: str
    mime_type: Optional[str] = None
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
    # ensure upload directory exists
    upload_dir = Path(os.getenv("UPLOAD_DIR", "./backend/uploads"))
    upload_dir.mkdir(parents=True, exist_ok=True)
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


def _save_attachment_file(base64_data: str, original_name: str) -> dict:
    # decode base64 payload and write to disk, returning metadata
    allowed_ext = {".pdf", ".doc", ".docx", ".odt", ".xls", ".xlsx", ".zip"}
    upload_dir = Path(os.getenv("UPLOAD_DIR", "./backend/uploads"))
    # derive extension
    ext = Path(original_name).suffix.lower()
    if ext not in allowed_ext:
        raise ValueError("Invalid file extension")

    try:
        header_idx = base64_data.find(",")
        if header_idx != -1:
            base64_str = base64_data[header_idx + 1 :]
        else:
            base64_str = base64_data
        file_bytes = base64.b64decode(base64_str)
    except Exception:
        raise ValueError("Invalid base64 data")

    # size limit 10MB
    if len(file_bytes) > 10 * 1024 * 1024:
        raise ValueError("File too large")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / unique_name
    dest.write_bytes(file_bytes)

    mime_type, _ = mimetypes.guess_type(original_name)
    return {"filename": original_name, "filepath": str(dest.resolve()), "mime_type": mime_type}


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

    # handle optional attachment payload (base64 from frontend)
    attachment_info = data.get("attachment")
    attachment_record = None
    if attachment_info and isinstance(attachment_info, dict):
        name = attachment_info.get("name")
        b64 = attachment_info.get("data")
        if name and b64:
            try:
                meta = _save_attachment_file(b64, name)
                att = Attachment(registration_id=reg.id, filename=meta["filename"], filepath=meta["filepath"], mime_type=meta.get("mime_type"))
                session.add(att)
                session.commit()
                session.refresh(att)
                attachment_record = {"id": att.id, "filename": att.filename, "mime_type": att.mime_type}
            except ValueError as e:
                # invalid attachment; rollback and return error
                session.rollback()
                response.status_code = status.HTTP_400_BAD_REQUEST
                return {"message": "Invalid attachment: " + str(e)}

    session.commit()
    result = {"message": "Submitted", "registration": reg.dict()}
    if attachment_record:
        result["attachment"] = attachment_record
    return result


@app.get("/registrations")
def list_registrations(x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return {"registrations": []}
    role = user.role
    if role == "Supervisor":
        # supervisors should see all registrations assigned to them (not only pending)
        regs = session.exec(select(Registration).where(Registration.supervisor == x_user_email)).all()
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


@app.get("/registrations/{reg_id}/attachments")
def list_registration_attachments(reg_id: int, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return {"attachments": []}

    reg = session.get(Registration, reg_id)
    if not reg:
        return {"attachments": []}

    # access control: students can see their own, supervisors their supervised regs, coordinators all
    if user.role == "Student" and reg.owner != x_user_email:
        return {"attachments": []}
    if user.role == "Supervisor" and reg.supervisor != x_user_email:
        return {"attachments": []}

    atts = session.exec(select(Attachment).where(Attachment.registration_id == reg_id)).all()
    return {"attachments": [{"id": a.id, "filename": a.filename, "mime_type": a.mime_type, "created_at": a.created_at.isoformat()} for a in atts]}


@app.get("/attachments/{att_id}/download")
def download_attachment(att_id: int, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    att = session.get(Attachment, att_id)
    if not att:
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    reg = session.get(Registration, att.registration_id)
    if not reg:
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    # access control
    if user.role == "Student" and reg.owner != x_user_email:
        return Response(status_code=status.HTTP_403_FORBIDDEN)
    if user.role == "Supervisor" and reg.supervisor != x_user_email:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    if not Path(att.filepath).exists():
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    return FileResponse(path=att.filepath, filename=att.filename, media_type=att.mime_type or "application/octet-stream")


@app.patch("/registrations/{reg_id}/approve")
def approve_registration(reg_id: int, data: dict = Body(None), response: Response = None, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Supervisor":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only supervisors can approve"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    # optional remarks provided by supervisor
    remarks = None
    if isinstance(data, dict):
        remarks = data.get("remarks")

    reg.status = "approved"
    if remarks:
        reg.remarks = remarks
    reg.history = reg.history or []
    note = "Supervisor approved"
    if remarks:
        note = f"{note}: {remarks}"
    reg.history.append({"actor": x_user_email, "action": "approved", "note": note, "at": datetime.utcnow().isoformat()})
    session.add(reg)
    push_notification_db(session, reg.owner, f"Your registration '{reg.title}' was approved by {x_user_email}")
    coords = session.exec(select(User).where(User.role == "Coordinator")).all()
    for c in coords:
        push_notification_db(session, c.email, f"Registration '{reg.title}' approved by supervisor {x_user_email}")

    session.commit()
    session.refresh(reg)
    return {"message": "Approved", "registration": reg.dict()}


@app.patch("/registrations/{reg_id}/reject")
def reject_registration(reg_id: int, data: dict = Body(None), response: Response = None, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Supervisor":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only supervisors can reject"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    # optional remarks provided by supervisor
    remarks = None
    if isinstance(data, dict):
        remarks = data.get("remarks")

    reg.status = "rejected"
    if remarks:
        reg.remarks = remarks
    reg.history = reg.history or []
    note = "Supervisor rejected"
    if remarks:
        note = f"{note}: {remarks}"
    reg.history.append({"actor": x_user_email, "action": "rejected", "note": note, "at": datetime.utcnow().isoformat()})
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



@app.delete("/registrations/{reg_id}")
def delete_registration(reg_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Student":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only the owner student can delete this registration"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    if reg.owner != x_user_email:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only the owner student can delete this registration"}

    # remove attachments files and rows
    atts = session.exec(select(Attachment).where(Attachment.registration_id == reg_id)).all()
    for a in atts:
        try:
            p = Path(a.filepath)
            if p.exists():
                p.unlink()
        except Exception:
            pass
        session.delete(a)

    session.delete(reg)
    push_notification_db(session, reg.supervisor, f"Registration '{reg.title}' was deleted by {x_user_email}")
    coords = session.exec(select(User).where(User.role == "Coordinator")).all()
    for c in coords:
        push_notification_db(session, c.email, f"Registration '{reg.title}' deleted by student {x_user_email}")

    session.commit()
    return {"message": "Deleted"}


@app.patch("/registrations/{reg_id}")
def update_registration(reg_id: int, data: dict, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session: Session = Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Student":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only the owner student can update this registration"}

    reg = session.get(Registration, reg_id)
    if not reg:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    if reg.owner != x_user_email:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only the owner student can update this registration"}

    updated = False
    title = data.get("title")
    abstract = data.get("abstract")
    if title:
        reg.title = title
        updated = True
    if abstract is not None:
        reg.abstract = abstract
        updated = True

    # optional new attachment
    attachment_info = data.get("attachment")
    attachment_record = None
    if attachment_info and isinstance(attachment_info, dict):
        name = attachment_info.get("name")
        b64 = attachment_info.get("data")
        if name and b64:
            try:
                meta = _save_attachment_file(b64, name)
                att = Attachment(registration_id=reg.id, filename=meta["filename"], filepath=meta["filepath"], mime_type=meta.get("mime_type"))
                session.add(att)
                session.commit()
                session.refresh(att)
                attachment_record = {"id": att.id, "filename": att.filename, "mime_type": att.mime_type}
                updated = True
            except ValueError as e:
                session.rollback()
                response.status_code = status.HTTP_400_BAD_REQUEST
                return {"message": "Invalid attachment: " + str(e)}

    if updated:
        reg.history = reg.history or []
        reg.history.append({"actor": x_user_email, "action": "edited", "note": "Student edited registration", "at": datetime.utcnow().isoformat()})
        session.add(reg)
        push_notification_db(session, reg.supervisor, f"Registration '{reg.title}' was edited by {x_user_email}")
        session.commit()
        session.refresh(reg)

    result = {"message": "Updated", "registration": reg.dict()}
    if attachment_record:
        result["attachment"] = attachment_record
    return result

