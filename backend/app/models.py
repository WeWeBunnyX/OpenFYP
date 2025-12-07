from typing import List, Optional
from sqlmodel import SQLModel, Field, create_engine, Session
from sqlalchemy import Column, JSON
from datetime import datetime
from pathlib import Path
import os


# Database URL is read from env in main; we expect main to set DATABASE_URL env if needed
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/dev.db")

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
    defense: Optional[dict] = Field(sa_column=Column(JSON), default=None)
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


class Scheduling(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    registration_id: Optional[int] = None
    title: Optional[str] = None
    proposal: Optional[str] = None
    student_email: Optional[str] = None
    status: str = Field(default="scheduled")
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    slot_minutes: Optional[int] = None
    committee: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InterimScheduling(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    registration_id: Optional[int] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    student_email: Optional[str] = None
    status: str = Field(default="scheduled")
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    slot_minutes: Optional[int] = None
    evaluators: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProposalEvaluation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    registration_id: Optional[int] = None
    student_email: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: str = Field(default="pending")
    result: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class ProgressLog(SQLModel, table=True):
    """Progress logs uploaded by students for sequential tracking.

    Fields mirror the frontend contract in `StudentProgressTracking.tsx`.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    owner: str
    slot: int
    title: Optional[str] = None
    description: str
    file_path: Optional[str] = None
    mime_type: Optional[str] = None
    file_url: Optional[str] = None
    sign_status: str = Field(default="pending")  # "pending" or "signed"
    created_at: datetime = Field(default_factory=datetime.utcnow)


def get_session():
    with Session(engine) as session:
        yield session
