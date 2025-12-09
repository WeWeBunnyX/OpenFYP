"""Routes for managing interim evaluation marks.

This module handles all interim evaluation marks-related operations:
- Submitting marks for interim evaluations (Stage 1 and Stage 2)
- Retrieving marks by student or scheduling
- Updating marks and feedback
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from .models import InterimEvaluationMarks, InterimScheduling, get_session, Session

router = APIRouter()


# Request models
class SubmitMarksRequest(BaseModel):
    """Request model for submitting interim evaluation marks."""
    interim_scheduling_id: int
    student_email: str
    stage: int  # 1 or 2
    marks: int  # 0-100
    evaluator_email: str
    feedback: Optional[str] = None


class UpdateMarksRequest(BaseModel):
    """Request model for updating interim evaluation marks."""
    marks: Optional[int] = None  # 0-100
    feedback: Optional[str] = None
    status: Optional[str] = None


# POST: Submit marks for interim evaluation
@router.post("/api/interim-marks/submit")
def submit_interim_marks(
    request: SubmitMarksRequest,
    session: Session = Depends(get_session),
):
    """
    Submit marks for an interim evaluation.
    
    Parameters:
    - interim_scheduling_id: ID of the interim scheduling record
    - student_email: Email of the student
    - stage: Evaluation stage (1 or 2)
    - marks: Marks awarded (0-100)
    - evaluator_email: Email of the evaluator/coordinator
    - feedback: Optional feedback/comments
    """
    
    # Validate marks
    if request.marks < 0 or request.marks > 100:
        raise HTTPException(status_code=400, detail="Marks must be between 0 and 100")
    
    # Verify scheduling record exists
    schedule = session.get(InterimScheduling, request.interim_scheduling_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Interim scheduling record not found")
    
    # Check if marks already exist for this scheduling (update instead of create)
    existing_marks = session.exec(
        select(InterimEvaluationMarks).where(
            InterimEvaluationMarks.interim_scheduling_id == request.interim_scheduling_id
        )
    ).first()
    
    if existing_marks:
        # Update existing marks
        existing_marks.marks = request.marks
        existing_marks.feedback = request.feedback
        existing_marks.stage = request.stage  # Also update the stage
        existing_marks.status = "submitted"
        existing_marks.updated_at = datetime.utcnow()
        session.add(existing_marks)
        session.commit()
        session.refresh(existing_marks)
        
        # Also update the schedule status
        schedule.status = "completed"
        session.add(schedule)
        session.commit()
        
        return {
            "id": existing_marks.id,
            "interimSchedulingId": existing_marks.interim_scheduling_id,
            "studentEmail": existing_marks.student_email,
            "evaluatorEmail": existing_marks.evaluator_email,
            "stage": existing_marks.stage,
            "marks": existing_marks.marks,
            "feedback": existing_marks.feedback,
            "status": existing_marks.status,
            "createdAt": existing_marks.created_at.isoformat(),
            "updatedAt": existing_marks.updated_at.isoformat() if existing_marks.updated_at else None,
        }
    
    # Create new marks record
    marks_record = InterimEvaluationMarks(
        interim_scheduling_id=request.interim_scheduling_id,
        student_email=request.student_email,
        evaluator_email=request.evaluator_email,
        stage=request.stage,
        marks=request.marks,
        feedback=request.feedback,
        status="submitted"
    )
    
    session.add(marks_record)
    session.commit()
    session.refresh(marks_record)
    
    # Update the schedule status to completed
    schedule.status = "completed"
    session.add(schedule)
    session.commit()
    
    return {
        "id": marks_record.id,
        "interimSchedulingId": marks_record.interim_scheduling_id,
        "studentEmail": marks_record.student_email,
        "evaluatorEmail": marks_record.evaluator_email,
        "stage": marks_record.stage,
        "marks": marks_record.marks,
        "feedback": marks_record.feedback,
        "status": marks_record.status,
        "createdAt": marks_record.created_at.isoformat(),
        "updatedAt": marks_record.updated_at.isoformat() if marks_record.updated_at else None,
    }


# GET: Retrieve all marks for a student
@router.get("/api/interim-marks/student/{student_email}")
def get_student_interim_marks(
    student_email: str,
    session: Session = Depends(get_session),
):
    """Fetch all interim evaluation marks for a specific student."""
    marks = session.exec(
        select(InterimEvaluationMarks).where(
            InterimEvaluationMarks.student_email == student_email
        )
    ).all()
    
    return {
        "studentEmail": student_email,
        "totalMarks": len(marks),
        "marks": [
            {
                "id": m.id,
                "interimSchedulingId": m.interim_scheduling_id,
                "stage": m.stage,
                "marks": m.marks,
                "feedback": m.feedback,
                "evaluatorEmail": m.evaluator_email,
                "status": m.status,
                "createdAt": m.created_at.isoformat(),
                "updatedAt": m.updated_at.isoformat() if m.updated_at else None,
            }
            for m in sorted(marks, key=lambda x: x.stage)
        ]
    }


# GET: Retrieve marks for a specific interim scheduling record
@router.get("/api/interim-marks/schedule/{schedule_id}")
def get_schedule_interim_marks(
    schedule_id: int,
    session: Session = Depends(get_session),
):
    """Fetch marks for a specific interim scheduling record."""
    marks = session.exec(
        select(InterimEvaluationMarks).where(
            InterimEvaluationMarks.interim_scheduling_id == schedule_id
        )
    ).first()
    
    if not marks:
        return {"found": False, "message": "No marks submitted yet"}
    
    return {
        "found": True,
        "id": marks.id,
        "interimSchedulingId": marks.interim_scheduling_id,
        "studentEmail": marks.student_email,
        "stage": marks.stage,
        "marks": marks.marks,
        "feedback": marks.feedback,
        "evaluatorEmail": marks.evaluator_email,
        "status": marks.status,
        "createdAt": marks.created_at.isoformat(),
        "updatedAt": marks.updated_at.isoformat() if marks.updated_at else None,
    }


# PATCH: Update marks for a specific record
@router.patch("/api/interim-marks/{marks_id}")
def update_interim_marks(
    marks_id: int,
    update: UpdateMarksRequest,
    session: Session = Depends(get_session),
):
    """Update marks and feedback for an interim evaluation."""
    marks = session.get(InterimEvaluationMarks, marks_id)
    if not marks:
        raise HTTPException(status_code=404, detail="Marks record not found")
    
    # Validate marks if provided
    if update.marks is not None:
        if update.marks < 0 or update.marks > 100:
            raise HTTPException(status_code=400, detail="Marks must be between 0 and 100")
        marks.marks = update.marks
    
    if update.feedback is not None:
        marks.feedback = update.feedback
    
    if update.status is not None:
        marks.status = update.status
    
    marks.updated_at = datetime.utcnow()
    session.add(marks)
    session.commit()
    session.refresh(marks)
    
    return {
        "id": marks.id,
        "interimSchedulingId": marks.interim_scheduling_id,
        "studentEmail": marks.student_email,
        "stage": marks.stage,
        "marks": marks.marks,
        "feedback": marks.feedback,
        "evaluatorEmail": marks.evaluator_email,
        "status": marks.status,
        "createdAt": marks.created_at.isoformat(),
        "updatedAt": marks.updated_at.isoformat() if marks.updated_at else None,
    }


# GET: Summary of all interim marks by stage
@router.get("/api/interim-marks/summary/all")
def get_all_interim_marks_summary(session: Session = Depends(get_session)):
    """Get a summary of all interim marks grouped by stage."""
    all_marks = session.exec(select(InterimEvaluationMarks)).all()
    
    stage1_marks = [m for m in all_marks if m.stage == 1]
    stage2_marks = [m for m in all_marks if m.stage == 2]
    
    return {
        "totalRecords": len(all_marks),
        "stage1": {
            "count": len(stage1_marks),
            "averageMarks": sum(m.marks for m in stage1_marks) / len(stage1_marks) if stage1_marks else 0,
        },
        "stage2": {
            "count": len(stage2_marks),
            "averageMarks": sum(m.marks for m in stage2_marks) / len(stage2_marks) if stage2_marks else 0,
        }
    }
