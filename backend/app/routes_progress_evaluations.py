from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from .models import ProgressGrading, InterimScheduling, Registration, ProgressLog, get_session, Session

router = APIRouter()


# Request models
class EvaluationCreate(BaseModel):
    student_email: str
    student_name: str
    project_title: str
    supervisor_email: str
    supervisor_name: str
    evaluation_month: int
    evaluation_week: int
    criteria: List[dict]
    overall_feedback: str
    final_score: int


class EvaluationUpdate(BaseModel):
    criteria: Optional[List[dict]] = None
    overall_feedback: Optional[str] = None
    final_score: Optional[int] = None


class InterimScheduleCreate(BaseModel):
    """Request model for creating interim scheduling"""
    student_email: str
    registration_id: Optional[int] = None
    title: Optional[str] = None
    start: datetime  # Scheduling date with time
    slot_minutes: int  # Duration of the slot
    notes: Optional[str] = None
    evaluators: Optional[List[str]] = None


class InterimScheduleUpdate(BaseModel):
    """Request model for updating interim scheduling marks"""
    marks: int
    feedback: Optional[str] = None
    evaluators: Optional[List[str]] = None


@router.post("/api/evaluations")
def create_evaluation(
    evaluation: EvaluationCreate,
    session: Session = Depends(get_session),
):
    """Create a new evaluation record."""
    if evaluation.evaluation_month < 1 or evaluation.evaluation_month > 7:
        raise HTTPException(status_code=400, detail="Evaluation month must be between 1 and 7")
    if evaluation.evaluation_week < 1 or evaluation.evaluation_week > 2:
        raise HTTPException(status_code=400, detail="Evaluation week must be 1 or 2")
    if evaluation.final_score < 0 or evaluation.final_score > 100:
        raise HTTPException(status_code=400, detail="Final score must be between 0 and 100")

    # Check if evaluation for this student, month, week already exists
    existing = session.exec(
        select(ProgressGrading).where(
            (ProgressGrading.student_email == evaluation.student_email)
            & (ProgressGrading.evaluation_month == evaluation.evaluation_month)
            & (ProgressGrading.evaluation_week == evaluation.evaluation_week)
        )
    ).first()

    if existing:
        # Update existing evaluation
        existing.supervisor_email = evaluation.supervisor_email
        existing.supervisor_name = evaluation.supervisor_name
        existing.criteria = evaluation.criteria
        existing.overall_feedback = evaluation.overall_feedback
        existing.final_score = evaluation.final_score
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return {
            "id": existing.id,
            "studentEmail": existing.student_email,
            "studentName": existing.student_name,
            "projectTitle": existing.project_title,
            "supervisorEmail": existing.supervisor_email,
            "supervisorName": existing.supervisor_name,
            "evaluationMonth": existing.evaluation_month,
            "evaluationWeek": existing.evaluation_week,
            "criteria": existing.criteria,
            "overallFeedback": existing.overall_feedback,
            "finalScore": existing.final_score,
            "submittedAt": existing.submitted_at.isoformat() if existing.submitted_at else None,
        }

    # Create new evaluation
    db_evaluation = ProgressGrading(
        student_email=evaluation.student_email,
        student_name=evaluation.student_name,
        project_title=evaluation.project_title,
        supervisor_email=evaluation.supervisor_email,
        supervisor_name=evaluation.supervisor_name,
        evaluation_month=evaluation.evaluation_month,
        evaluation_week=evaluation.evaluation_week,
        criteria=evaluation.criteria,
        overall_feedback=evaluation.overall_feedback,
        final_score=evaluation.final_score,
    )
    session.add(db_evaluation)
    session.commit()
    session.refresh(db_evaluation)

    return {
        "id": db_evaluation.id,
        "studentEmail": db_evaluation.student_email,
        "studentName": db_evaluation.student_name,
        "projectTitle": db_evaluation.project_title,
        "supervisorEmail": db_evaluation.supervisor_email,
        "supervisorName": db_evaluation.supervisor_name,
        "evaluationMonth": db_evaluation.evaluation_month,
        "evaluationWeek": db_evaluation.evaluation_week,
        "criteria": db_evaluation.criteria,
        "overallFeedback": db_evaluation.overall_feedback,
        "finalScore": db_evaluation.final_score,
        "submittedAt": db_evaluation.submitted_at.isoformat() if db_evaluation.submitted_at else None,
    }


@router.get("/api/evaluations")
def list_evaluations(
    student_email: Optional[str] = Query(None),
    supervisor_email: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    """List evaluations filtered by student or supervisor email."""
    query = select(ProgressGrading)

    if student_email:
        query = query.where(ProgressGrading.student_email == student_email)
    if supervisor_email:
        query = query.where(ProgressGrading.supervisor_email == supervisor_email)

    evaluations = session.exec(query.order_by(desc(ProgressGrading.submitted_at))).all()

    def map_evaluation(e: ProgressGrading):
        return {
            "id": e.id,
            "studentEmail": e.student_email,
            "studentName": e.student_name,
            "projectTitle": e.project_title,
            "supervisorEmail": e.supervisor_email,
            "supervisorName": e.supervisor_name,
            "evaluationMonth": e.evaluation_month,
            "evaluationWeek": e.evaluation_week,
            "criteria": e.criteria,
            "overallFeedback": e.overall_feedback,
            "finalScore": e.final_score,
            "submittedAt": e.submitted_at.isoformat() if e.submitted_at else None,
        }

    return [map_evaluation(e) for e in evaluations]


@router.get("/api/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: int, session: Session = Depends(get_session)):
    """Get a specific evaluation by ID."""
    evaluation = session.get(ProgressGrading, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    return {
        "id": evaluation.id,
        "studentEmail": evaluation.student_email,
        "studentName": evaluation.student_name,
        "projectTitle": evaluation.project_title,
        "supervisorEmail": evaluation.supervisor_email,
        "supervisorName": evaluation.supervisor_name,
        "evaluationMonth": evaluation.evaluation_month,
        "evaluationWeek": evaluation.evaluation_week,
        "criteria": evaluation.criteria,
        "overallFeedback": evaluation.overall_feedback,
        "finalScore": evaluation.final_score,
        "submittedAt": evaluation.submitted_at.isoformat() if evaluation.submitted_at else None,
    }


@router.get("/api/evaluations/student/{student_email}")
def get_student_evaluations(student_email: str, session: Session = Depends(get_session)):
    """Get all evaluations for a specific student (for student view)."""
    evaluations = session.exec(
        select(ProgressGrading)
        .where(ProgressGrading.student_email == student_email)
        .order_by(ProgressGrading.evaluation_month, ProgressGrading.evaluation_week)
    ).all()

    def map_evaluation(e: ProgressGrading):
        return {
            "id": e.id,
            "studentEmail": e.student_email,
            "studentName": e.student_name,
            "projectTitle": e.project_title,
            "supervisorEmail": e.supervisor_email,
            "supervisorName": e.supervisor_name,
            "evaluationMonth": e.evaluation_month,
            "evaluationWeek": e.evaluation_week,
            "criteria": e.criteria,
            "overallFeedback": e.overall_feedback,
            "finalScore": e.final_score,
            "submittedAt": e.submitted_at.isoformat() if e.submitted_at else None,
        }

    return [map_evaluation(e) for e in evaluations]


@router.get("/api/evaluations/supervisor/{supervisor_email}")
def get_supervisor_evaluations(supervisor_email: str, session: Session = Depends(get_session)):
    """Get all evaluations submitted by a specific supervisor (for supervisor view)."""
    evaluations = session.exec(
        select(ProgressGrading)
        .where(ProgressGrading.supervisor_email == supervisor_email)
        .order_by(desc(ProgressGrading.submitted_at))
    ).all()

    # Group by student
    by_student = {}
    for e in evaluations:
        if e.student_email not in by_student:
            by_student[e.student_email] = {
                "studentEmail": e.student_email,
                "studentName": e.student_name,
                "projectTitle": e.project_title,
                "evaluations": [],
            }
        by_student[e.student_email]["evaluations"].append(
            {
                "id": e.id,
                "supervisorEmail": e.supervisor_email,
                "supervisorName": e.supervisor_name,
                "evaluationMonth": e.evaluation_month,
                "evaluationWeek": e.evaluation_week,
                "criteria": e.criteria,
                "overallFeedback": e.overall_feedback,
                "finalScore": e.final_score,
                "submittedAt": e.submitted_at.isoformat() if e.submitted_at else None,
            }
        )

    return list(by_student.values())


@router.get("/api/evaluations/coordinator/all-students")
def get_all_students_evaluations(session: Session = Depends(get_session)):
    """Get all evaluations for all students (for coordinator view)."""
    evaluations = session.exec(
        select(ProgressGrading).order_by(
            ProgressGrading.student_email, ProgressGrading.evaluation_month, ProgressGrading.evaluation_week
        )
    ).all()

    # Group by student
    by_student = {}
    for e in evaluations:
        if e.student_email not in by_student:
            by_student[e.student_email] = {
                "studentEmail": e.student_email,
                "studentName": e.student_name,
                "projectTitle": e.project_title,
                "evaluations": [],
            }
        by_student[e.student_email]["evaluations"].append(
            {
                "id": e.id,
                "supervisorEmail": e.supervisor_email,
                "supervisorName": e.supervisor_name,
                "evaluationMonth": e.evaluation_month,
                "evaluationWeek": e.evaluation_week,
                "criteria": e.criteria,
                "overallFeedback": e.overall_feedback,
                "finalScore": e.final_score,
                "submittedAt": e.submitted_at.isoformat() if e.submitted_at else None,
            }
        )

    return list(by_student.values())


@router.patch("/api/evaluations/{evaluation_id}")
def update_evaluation(
    evaluation_id: int,
    update_data: EvaluationUpdate,
    session: Session = Depends(get_session),
):
    """Update an evaluation (for supervisor edits)."""
    evaluation = session.get(ProgressGrading, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    if update_data.criteria is not None:
        evaluation.criteria = update_data.criteria
    if update_data.overall_feedback is not None:
        evaluation.overall_feedback = update_data.overall_feedback
    if update_data.final_score is not None:
        if update_data.final_score < 0 or update_data.final_score > 100:
            raise HTTPException(status_code=400, detail="Final score must be between 0 and 100")
        evaluation.final_score = update_data.final_score

    evaluation.updated_at = datetime.utcnow()
    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)

    return {
        "id": evaluation.id,
        "studentEmail": evaluation.student_email,
        "studentName": evaluation.student_name,
        "projectTitle": evaluation.project_title,
        "supervisorEmail": evaluation.supervisor_email,
        "supervisorName": evaluation.supervisor_name,
        "evaluationMonth": evaluation.evaluation_month,
        "evaluationWeek": evaluation.evaluation_week,
        "criteria": evaluation.criteria,
        "overallFeedback": evaluation.overall_feedback,
        "finalScore": evaluation.final_score,
        "submittedAt": evaluation.submitted_at.isoformat() if evaluation.submitted_at else None,
    }


@router.delete("/api/evaluations/{evaluation_id}")
def delete_evaluation(evaluation_id: int, session: Session = Depends(get_session)):
    """Delete an evaluation (for supervisor corrections before submission)."""
    evaluation = session.get(ProgressGrading, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    session.delete(evaluation)
    session.commit()

    return {"message": "Evaluation deleted successfully"}


# Interim Scheduling Endpoints

@router.post("/api/interim-scheduling")
def create_interim_scheduling(
    schedule: InterimScheduleCreate,
    session: Session = Depends(get_session),
):
    """
    Create an interim scheduling for a student.
    
    Parameters:
    - student_email: Email of the student
    - start: Start datetime (date + time)
    - slot_minutes: Duration of the evaluation slot in minutes
    - notes: Optional notes for the scheduling
    - evaluators: Optional list of evaluator emails
    """
    
    # Validate student exists in evaluations
    student_evals = session.exec(
        select(ProgressGrading).where(
            ProgressGrading.student_email == schedule.student_email
        )
    ).first()
    
    if not student_evals:
        raise HTTPException(status_code=404, detail="Student has no evaluations found")
    
    # Calculate end time based on slot_minutes
    end_time = datetime.fromtimestamp(
        schedule.start.timestamp() + (schedule.slot_minutes * 60)
    )
    
    # Create interim scheduling record
    interim = InterimScheduling(
        student_email=schedule.student_email,
        registration_id=schedule.registration_id,
        title=schedule.title,
        start=schedule.start,
        end=end_time,
        slot_minutes=schedule.slot_minutes,
        notes=schedule.notes,
        evaluators=schedule.evaluators or [],
        status="scheduled",
    )
    
    session.add(interim)
    session.commit()
    session.refresh(interim)
    
    return {
        "id": interim.id,
        "studentEmail": interim.student_email,
        "registrationId": interim.registration_id,
        "title": interim.title,
        "start": interim.start.isoformat(),
        "end": interim.end.isoformat(),
        "slotMinutes": interim.slot_minutes,
        "notes": interim.notes,
        "evaluators": interim.evaluators,
        "status": interim.status,
        "createdAt": interim.created_at.isoformat(),
    }


@router.get("/api/interim-scheduling")
def get_all_interim_scheduling(session: Session = Depends(get_session)):
    """Fetch all interim scheduling records."""
    schedules = session.exec(select(InterimScheduling)).all()
    
    return [
        {
            "id": s.id,
            "studentEmail": s.student_email,
            "registrationId": s.registration_id,
            "title": s.title,
            "start": s.start.isoformat() if s.start else None,
            "end": s.end.isoformat() if s.end else None,
            "slotMinutes": s.slot_minutes,
            "notes": s.notes,
            "evaluators": s.evaluators,
            "status": s.status,
            "createdAt": s.created_at.isoformat(),
        }
        for s in schedules
    ]


@router.get("/api/interim-scheduling/{student_email}")
def get_interim_scheduling_by_student(
    student_email: str,
    session: Session = Depends(get_session),
):
    """Fetch interim scheduling for a specific student."""
    schedules = session.exec(
        select(InterimScheduling).where(
            InterimScheduling.student_email == student_email
        ).order_by(InterimScheduling.id)  # Sort by ID ascending to ensure Stage 1 first, then Stage 2
    ).all()
    
    if not schedules:
        raise HTTPException(status_code=404, detail="No scheduling found for this student")
    
    return [
        {
            "id": s.id,
            "studentEmail": s.student_email,
            "registrationId": s.registration_id,
            "title": s.title,
            "start": s.start.isoformat() if s.start else None,
            "end": s.end.isoformat() if s.end else None,
            "slotMinutes": s.slot_minutes,
            "notes": s.notes,
            "evaluators": s.evaluators,
            "status": s.status,
            "createdAt": s.created_at.isoformat(),
        }
        for s in schedules
    ]


@router.patch("/api/interim-scheduling/{schedule_id}")
def update_interim_scheduling(
    schedule_id: int,
    update: InterimScheduleUpdate,
    session: Session = Depends(get_session),
):
    """
    Update interim scheduling marks/feedback.
    
    Parameters:
    - schedule_id: ID of the scheduling record
    - marks: Marks awarded
    - feedback: Optional feedback
    - evaluators: Optional list of evaluator emails
    """
    
    schedule = session.get(InterimScheduling, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Interim scheduling not found")
    
    schedule.status = "completed"
    if update.evaluators:
        schedule.evaluators = update.evaluators
    if update.feedback:
        schedule.notes = update.feedback
    
    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    
    return {
        "id": schedule.id,
        "studentEmail": schedule.student_email,
        "start": schedule.start.isoformat(),
        "end": schedule.end.isoformat(),
        "slotMinutes": schedule.slot_minutes,
        "notes": schedule.notes,
        "evaluators": schedule.evaluators,
        "status": schedule.status,
        "createdAt": schedule.created_at.isoformat(),
    }


@router.get("/api/interim-scheduling/supervisor/{supervisor_email}")
def get_interim_scheduling_by_supervisor(
    supervisor_email: str,
    session: Session = Depends(get_session),
):
    """Fetch all students and their interim evaluations for a supervisor."""
    # Get all registrations where this person is the supervisor
    registrations = session.exec(
        select(Registration).where(
            Registration.supervisor == supervisor_email
        )
    ).all()
    
    if not registrations:
        return []
    
    # For each student, fetch their interim scheduling and marks
    students = []
    for reg in registrations:
        student_email = reg.owner
        
        # Get interim schedules for this student
        schedules = session.exec(
            select(InterimScheduling).where(
                InterimScheduling.student_email == student_email
            )
        ).all()
        
        # Get progress log count for eligibility
        progress_logs = session.exec(
            select(ProgressLog).where(
                ProgressLog.owner == student_email
            )
        ).all()
        
        logs_submitted = len(progress_logs)
        
        # Get supervisor evaluations completion status
        supervisor_evals = session.exec(
            select(ProgressGrading).where(
                ProgressGrading.student_email == student_email,
                ProgressGrading.supervisor_email == supervisor_email
            )
        ).all()
        
        supervisor_evals_complete = len(supervisor_evals) > 0
        
        # Build student data
        student_data = {
            "email": student_email,
            "name": reg.owner,
            "projectTitle": reg.title,
            "registrationId": reg.id,
            "logsSubmitted": logs_submitted,
            "supervisorEvaluationsComplete": supervisor_evals_complete,
            "eligibleForStage1": logs_submitted >= 12,
            "eligibleForStage2": logs_submitted >= 24,
            "interimStage1Status": "pending",
            "interimStage1Schedule": None,
            "interimStage2Status": "pending",
            "interimStage2Schedule": None,
        }
        
        # Assign schedules to stages
        if len(schedules) > 0:
            stage1_sched = schedules[0]
            student_data["interimStage1Status"] = stage1_sched.status
            student_data["interimStage1Schedule"] = {
                "id": stage1_sched.id,
                "start": stage1_sched.start.isoformat() if stage1_sched.start else None,
                "end": stage1_sched.end.isoformat() if stage1_sched.end else None,
                "slotMinutes": stage1_sched.slot_minutes,
                "evaluators": stage1_sched.evaluators,
                "status": stage1_sched.status,
            }
        
        if len(schedules) > 1:
            stage2_sched = schedules[1]
            student_data["interimStage2Status"] = stage2_sched.status
            student_data["interimStage2Schedule"] = {
                "id": stage2_sched.id,
                "start": stage2_sched.start.isoformat() if stage2_sched.start else None,
                "end": stage2_sched.end.isoformat() if stage2_sched.end else None,
                "slotMinutes": stage2_sched.slot_minutes,
                "evaluators": stage2_sched.evaluators,
                "status": stage2_sched.status,
            }
        
        students.append(student_data)
    
    return students

