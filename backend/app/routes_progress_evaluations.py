from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, desc
from typing import List, Optional
from datetime import datetime

from .models import ProgressGrading, get_session, Session

router = APIRouter()


@router.post("/api/evaluations")
def create_evaluation(
    student_email: str,
    student_name: str,
    project_title: str,
    supervisor_email: str,
    supervisor_name: str,
    evaluation_month: int,
    evaluation_week: int,
    criteria: List[dict],
    overall_feedback: str,
    final_score: int,
    session: Session = Depends(get_session),
):
    """Create a new evaluation record."""
    if evaluation_month < 1 or evaluation_month > 7:
        raise HTTPException(status_code=400, detail="Evaluation month must be between 1 and 7")
    if evaluation_week < 1 or evaluation_week > 2:
        raise HTTPException(status_code=400, detail="Evaluation week must be 1 or 2")
    if final_score < 0 or final_score > 100:
        raise HTTPException(status_code=400, detail="Final score must be between 0 and 100")

    # Check if evaluation for this student, month, week already exists
    existing = session.exec(
        select(ProgressGrading).where(
            (ProgressGrading.student_email == student_email)
            & (ProgressGrading.evaluation_month == evaluation_month)
            & (ProgressGrading.evaluation_week == evaluation_week)
        )
    ).first()

    if existing:
        # Update existing evaluation
        existing.supervisor_email = supervisor_email
        existing.supervisor_name = supervisor_name
        existing.criteria = criteria
        existing.overall_feedback = overall_feedback
        existing.final_score = final_score
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
    evaluation = ProgressGrading(
        student_email=student_email,
        student_name=student_name,
        project_title=project_title,
        supervisor_email=supervisor_email,
        supervisor_name=supervisor_name,
        evaluation_month=evaluation_month,
        evaluation_week=evaluation_week,
        criteria=criteria,
        overall_feedback=overall_feedback,
        final_score=final_score,
    )
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
    criteria: Optional[List[dict]] = None,
    overall_feedback: Optional[str] = None,
    final_score: Optional[int] = None,
    session: Session = Depends(get_session),
):
    """Update an evaluation (for supervisor edits)."""
    evaluation = session.get(ProgressGrading, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    if criteria is not None:
        evaluation.criteria = criteria
    if overall_feedback is not None:
        evaluation.overall_feedback = overall_feedback
    if final_score is not None:
        if final_score < 0 or final_score > 100:
            raise HTTPException(status_code=400, detail="Final score must be between 0 and 100")
        evaluation.final_score = final_score

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
