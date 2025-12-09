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


class ProgressGrading(SQLModel, table=True):
    """Supervisor evaluations of student progress (every 15 days, months 1-7).
    
    Stores weighted scores and feedback from supervisors for student progress evaluations.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    student_email: str
    student_name: str
    project_title: str
    supervisor_email: str
    supervisor_name: str
    evaluation_month: int  # 1-7
    evaluation_week: int  # 1-2 (15-day periods)
    criteria: List[dict] = Field(sa_column=Column(JSON), default_factory=list)  # [{"name": ..., "weight": ..., "score": ..., "feedback": ...}]
    overall_feedback: str
    final_score: int  # weighted score 0-100
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class InterimEvaluationMarks(SQLModel, table=True):
    """Marks and feedback submitted for interim evaluations.
    
    Stores Stage 1 (Month 4) and Stage 2 (Month 7+) evaluation marks awarded to students.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    interim_scheduling_id: int
    student_email: str
    evaluator_email: str
    stage: int  # 1 or 2
    marks: int  # 0-100
    feedback: Optional[str] = None
    status: str = Field(default="submitted")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class FinalEvaluationViva(SQLModel, table=True):
    """Final evaluation and viva records for student projects.
    
    Comprehensive storage for all final evaluation data including:
    - Committee member assignments (Chairman, Internal, External)
    - Grading rubric configuration
    - Committee member marks and feedback
    - Calculated weighted averages and final grades
    - Approval workflow status
    - Publication status and timestamps
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Student Information
    registration_id: Optional[int] = None
    student_email: str = Field(index=True)
    student_name: str
    project_title: str
    supervisor_email: Optional[str] = None
    supervisor_name: Optional[str] = None
    
    # Viva Scheduling
    viva_date: Optional[datetime] = None
    viva_location: Optional[str] = None
    
    # Committee Members (stored as JSON list)
    # Format: [{"id": "c1", "name": "Dr. Ahmed Khan", "email": "dr.ahmed@uni.edu", "role": "Chairman"}, ...]
    committee_members: List[dict] = Field(sa_column=Column(JSON), default_factory=list)
    
    # Grading Rubric (stored as JSON list)
    # Format: [{"id": "r1", "criteriaName": "Technical Knowledge", "maxMarks": 25, "weight": 0.25}, ...]
    grading_rubric: List[dict] = Field(sa_column=Column(JSON), default_factory=list)
    
    # Committee Member Marks and Feedback (stored as JSON dict)
    # Format: {"c1": {"marks": 85, "feedback": "Excellent", "submittedAt": "2025-12-15T11:30:00"}, ...}
    committee_marks: dict = Field(sa_column=Column(JSON), default_factory=dict)
    
    # Calculated Results
    weighted_average: Optional[float] = None  # Auto-calculated from committee marks and rubric weights
    final_grade: Optional[str] = None  # A, B, C, D based on weighted_average
    
    # Approval Workflow
    approval_status: str = Field(default="pending")  # pending, approved, rejected
    approval_feedback: Optional[str] = None
    approved_by: Optional[str] = None  # Coordinator email
    approved_at: Optional[datetime] = None
    
    # Publication Status
    status: str = Field(default="pending")  # pending, scheduled, in-progress, completed, published
    published_at: Optional[datetime] = None
    published_by: Optional[str] = None  # Coordinator email
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


def get_session():
    with Session(engine) as session:
        yield session

