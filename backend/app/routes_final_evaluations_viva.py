"""Routes for managing final evaluation and viva records.

This module handles all final evaluation operations:
- Coordinator: Create, manage committee, configure rubric, submit marks, approve, publish
- Supervisor: View all supervised students' final evaluations
- Student: View their own final evaluation results
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, and_
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from .models import FinalEvaluationViva, get_session, Session, Registration, User

router = APIRouter()


# ==================== Request/Response Models ====================

class CommitteeMemberRequest(BaseModel):
    """Request model for committee member assignment."""
    name: str
    email: str
    role: str  # "Chairman", "Internal", "External"


class GradingRubricRequest(BaseModel):
    """Request model for grading rubric item."""
    criteriaName: str
    maxMarks: float
    weight: float


class SubmitMarksRequest(BaseModel):
    """Request model for submitting marks by committee member."""
    marks: float  # 0-100
    feedback: Optional[str] = None


class ApproveMarksRequest(BaseModel):
    """Request model for coordinator to approve marks."""
    approval_feedback: Optional[str] = None


class PublishResultsRequest(BaseModel):
    """Request model for publishing final results."""
    publish: bool = True


# ==================== Coordinator Endpoints ====================

@router.get("/api/final-evaluation/coordinator/students")
def get_students_for_final_eval(
    session: Session = Depends(get_session),
):
    """Get all students requiring final evaluation (for coordinator).
    
    Returns list of students who have passed BOTH Stage 1 and Stage 2 interim evaluations
    and don't have final evaluations yet.
    """
    try:
        from .models import InterimEvaluationMarks
        
        # Get all active registrations
        registrations = session.exec(
            select(Registration).where(
                Registration.status.in_(["approved", "scheduled"])
            )
        ).all()
        
        result = []
        for reg in registrations:
            # Check if student has passed BOTH Stage 1 and Stage 2 interim evaluations
            stage1_marks = session.exec(
                select(InterimEvaluationMarks).where(
                    and_(
                        InterimEvaluationMarks.student_email == reg.owner,
                        InterimEvaluationMarks.stage == 1
                    )
                )
            ).first()
            
            stage2_marks = session.exec(
                select(InterimEvaluationMarks).where(
                    and_(
                        InterimEvaluationMarks.student_email == reg.owner,
                        InterimEvaluationMarks.stage == 2
                    )
                )
            ).first()
            
            # Only include students who have both stage 1 and stage 2 marks
            if not stage1_marks or not stage2_marks:
                continue
            
            # Check if final evaluation exists
            existing = session.exec(
                select(FinalEvaluationViva).where(
                    and_(
                        FinalEvaluationViva.registration_id == reg.id,
                        FinalEvaluationViva.student_email == reg.owner
                    )
                )
            ).first()
            
            if not existing:
                # Fetch supervisor name from User table
                supervisor = session.exec(
                    select(User).where(User.email == reg.supervisor)
                ).first()
                supervisor_name = supervisor.name if supervisor else reg.supervisor
                
                # Create new final evaluation record
                final_eval = FinalEvaluationViva(
                    registration_id=reg.id,
                    student_email=reg.owner,
                    student_name=reg.owner,  # Use owner email as name (update later if needed)
                    project_title=reg.title,
                    supervisor_email=reg.supervisor,
                    supervisor_name=supervisor_name,
                    status="pending",
                    approval_status="pending",
                    committee_members=[],
                    grading_rubric=[],
                    committee_marks={},
                    weighted_average=None,
                    final_grade=None,
                    viva_date=None,
                    viva_location=None,
                    approval_feedback=None,
                    approved_by=None,
                    approved_at=None,
                    published_at=None,
                    published_by=None,
                )
                session.add(final_eval)
                session.commit()
                session.refresh(final_eval)
                result.append(final_eval)
            else:
                result.append(existing)
        
        return [
            {
                "id": e.id,
                "student_email": e.student_email,
                "student_name": e.student_name,
                "project_title": e.project_title,
                "supervisor_name": e.supervisor_name,
                "status": e.status,
                "committee_count": len(e.committee_members) if e.committee_members else 0,
                "approval_status": e.approval_status,
                "weighted_average": e.weighted_average,
                "final_grade": e.final_grade,
                "viva_date": e.viva_date,
                "created_at": e.created_at,
            }
            for e in result
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving students: {str(e)}")


@router.get("/api/final-evaluation/{final_eval_id}")
def get_final_evaluation(
    final_eval_id: int,
    session: Session = Depends(get_session),
):
    """Get complete final evaluation record with all details."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        return {
            "id": final_eval.id,
            "student_email": final_eval.student_email,
            "student_name": final_eval.student_name,
            "project_title": final_eval.project_title,
            "supervisor_email": final_eval.supervisor_email,
            "viva_date": final_eval.viva_date,
            "viva_location": final_eval.viva_location,
            "committee_members": final_eval.committee_members,
            "grading_rubric": final_eval.grading_rubric,
            "committee_marks": final_eval.committee_marks,
            "weighted_average": final_eval.weighted_average,
            "final_grade": final_eval.final_grade,
            "status": final_eval.status,
            "approval_status": final_eval.approval_status,
            "approval_feedback": final_eval.approval_feedback,
            "approved_by": final_eval.approved_by,
            "approved_at": final_eval.approved_at,
            "published_at": final_eval.published_at,
            "published_by": final_eval.published_by,
            "created_at": final_eval.created_at,
            "updated_at": final_eval.updated_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving evaluation: {str(e)}")


@router.post("/api/final-evaluation/{final_eval_id}/committee/add")
def add_committee_member(
    final_eval_id: int,
    request: CommitteeMemberRequest,
    session: Session = Depends(get_session),
):
    """Add a committee member to the final evaluation."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        # Check for valid roles
        if request.role not in ["Chairman", "Internal", "External"]:
            raise HTTPException(status_code=400, detail="Invalid committee role")
        
        # Check for duplicates
        for member in final_eval.committee_members:
            if member["email"] == request.email:
                raise HTTPException(status_code=400, detail="Committee member already added")
        
        # Add new member
        new_member = {
            "id": f"c{len(final_eval.committee_members) + 1}",
            "name": request.name,
            "email": request.email,
            "role": request.role
        }
        # Important: Reassign the list to trigger SQLAlchemy mutation tracking
        final_eval.committee_members = final_eval.committee_members + [new_member]
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Committee member added successfully",
            "committee_members": final_eval.committee_members
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding committee member: {str(e)}")


@router.delete("/api/final-evaluation/{final_eval_id}/committee/{member_id}")
def remove_committee_member(
    final_eval_id: int,
    member_id: str,
    session: Session = Depends(get_session),
):
    """Remove a committee member from the final evaluation."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        # Find and remove member
        initial_count = len(final_eval.committee_members)
        final_eval.committee_members = [m for m in final_eval.committee_members if m["id"] != member_id]
        
        if len(final_eval.committee_members) == initial_count:
            raise HTTPException(status_code=404, detail="Committee member not found")
        
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Committee member removed successfully",
            "committee_members": final_eval.committee_members
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing committee member: {str(e)}")


@router.post("/api/final-evaluation/{final_eval_id}/rubric/add")
def add_rubric_item(
    final_eval_id: int,
    request: GradingRubricRequest,
    session: Session = Depends(get_session),
):
    """Add a grading rubric item."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        # Validate rubric item
        if request.maxMarks <= 0:
            raise HTTPException(status_code=400, detail="Max marks must be greater than 0")
        if request.weight <= 0 or request.weight > 1:
            raise HTTPException(status_code=400, detail="Weight must be between 0 and 1")
        
        # Add new rubric item
        new_item = {
            "id": f"r{len(final_eval.grading_rubric) + 1}",
            "criteriaName": request.criteriaName,
            "maxMarks": request.maxMarks,
            "weight": request.weight
        }
        # Important: Reassign the list to trigger SQLAlchemy mutation tracking
        final_eval.grading_rubric = final_eval.grading_rubric + [new_item]
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        # Validate total weight
        total_weight = sum(item["weight"] for item in final_eval.grading_rubric)
        if abs(total_weight - 1.0) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Total weight must equal 1.0. Current: {total_weight:.2f}"
            )
        
        return {
            "success": True,
            "message": "Rubric item added successfully",
            "grading_rubric": final_eval.grading_rubric
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding rubric item: {str(e)}")


@router.delete("/api/final-evaluation/{final_eval_id}/rubric/{rubric_id}")
def remove_rubric_item(
    final_eval_id: int,
    rubric_id: str,
    session: Session = Depends(get_session),
):
    """Remove a grading rubric item."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        # Find and remove item
        initial_count = len(final_eval.grading_rubric)
        final_eval.grading_rubric = [r for r in final_eval.grading_rubric if r["id"] != rubric_id]
        
        if len(final_eval.grading_rubric) == initial_count:
            raise HTTPException(status_code=404, detail="Rubric item not found")
        
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Rubric item removed successfully",
            "grading_rubric": final_eval.grading_rubric
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing rubric item: {str(e)}")


@router.post("/api/final-evaluation/{final_eval_id}/committee/{member_id}/marks")
def submit_committee_marks(
    final_eval_id: int,
    member_id: str,
    request: SubmitMarksRequest,
    session: Session = Depends(get_session),
):
    """Submit marks by a committee member."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        # Validate marks
        if request.marks < 0 or request.marks > 100:
            raise HTTPException(status_code=400, detail="Marks must be between 0 and 100")
        
        # Add/update marks for this committee member
        if not final_eval.committee_marks:
            final_eval.committee_marks = {}
        
        # Important: Reassign the dict to trigger SQLAlchemy mutation tracking
        new_marks = final_eval.committee_marks.copy()
        new_marks[member_id] = {
            "marks": request.marks,
            "feedback": request.feedback or "",
            "submittedAt": datetime.utcnow().isoformat()
        }
        final_eval.committee_marks = new_marks
        
        # Calculate weighted average if all committee members have submitted
        if len(final_eval.committee_marks) == len(final_eval.committee_members):
            # Get all committee marks
            all_marks = []
            for member_marks in final_eval.committee_marks.values():
                all_marks.append(member_marks["marks"])

            # Calculate average of all committee marks
            if all_marks:
                weighted_average = sum(all_marks) / len(all_marks)
                final_eval.weighted_average = round(weighted_average, 2)
            else:
                final_eval.weighted_average = 0

            # Calculate final grade
            if final_eval.weighted_average >= 80:
                final_eval.final_grade = "A"
            elif final_eval.weighted_average >= 70:
                final_eval.final_grade = "B"
            elif final_eval.weighted_average >= 60:
                final_eval.final_grade = "C"
            else:
                final_eval.final_grade = "D"
            
            final_eval.status = "completed"
        
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Marks submitted successfully",
            "committee_marks": final_eval.committee_marks,
            "weighted_average": final_eval.weighted_average,
            "final_grade": final_eval.final_grade,
            "status": final_eval.status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting marks: {str(e)}")


@router.post("/api/final-evaluation/{final_eval_id}/approve")
def approve_final_evaluation(
    final_eval_id: int,
    request: ApproveMarksRequest,
    coordinator_email: str = Query(...),
    session: Session = Depends(get_session),
):
    """Approve final evaluation marks (coordinator only)."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        if not final_eval.weighted_average:
            raise HTTPException(status_code=400, detail="Cannot approve without submitted marks")
        
        final_eval.approval_status = "approved"
        final_eval.approval_feedback = request.approval_feedback
        final_eval.approved_by = coordinator_email
        final_eval.approved_at = datetime.utcnow()
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Final evaluation approved successfully",
            "approval_status": final_eval.approval_status,
            "approved_at": final_eval.approved_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving evaluation: {str(e)}")


@router.post("/api/final-evaluation/{final_eval_id}/publish")
def publish_final_results(
    final_eval_id: int,
    coordinator_email: str = Query(...),
    session: Session = Depends(get_session),
):
    """Publish final evaluation results to students."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        if final_eval.approval_status != "approved":
            raise HTTPException(status_code=400, detail="Evaluation must be approved before publishing")
        
        final_eval.status = "published"
        final_eval.published_at = datetime.utcnow()
        final_eval.published_by = coordinator_email
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Final results published successfully",
            "status": final_eval.status,
            "published_at": final_eval.published_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error publishing results: {str(e)}")


# ==================== Supervisor Endpoints ====================

@router.get("/api/final-evaluation/supervisor/{supervisor_email}")
def get_supervised_students_final_eval(
    supervisor_email: str,
    session: Session = Depends(get_session),
):
    """Get all supervised students' final evaluation results (for supervisor).
    
    Only returns students who have passed BOTH Stage 1 and Stage 2 interim evaluations.
    """
    try:
        from .models import InterimEvaluationMarks
        
        # Get all registrations supervised by this user
        registrations = session.exec(
            select(Registration).where(
                Registration.supervisor == supervisor_email
            )
        ).all()
        
        results = []
        for reg in registrations:
            # Check if student has passed BOTH Stage 1 and Stage 2 interim evaluations
            stage1_marks = session.exec(
                select(InterimEvaluationMarks).where(
                    and_(
                        InterimEvaluationMarks.student_email == reg.owner,
                        InterimEvaluationMarks.stage == 1
                    )
                )
            ).first()
            
            stage2_marks = session.exec(
                select(InterimEvaluationMarks).where(
                    and_(
                        InterimEvaluationMarks.student_email == reg.owner,
                        InterimEvaluationMarks.stage == 2
                    )
                )
            ).first()
            
            # Only include students who have both stage 1 and stage 2 marks
            if not stage1_marks or not stage2_marks:
                continue
            
            # Get final evaluation for this student
            final_eval = session.exec(
                select(FinalEvaluationViva).where(
                    and_(
                        FinalEvaluationViva.registration_id == reg.id,
                        FinalEvaluationViva.student_email == reg.owner
                    )
                )
            ).first()
            
            if final_eval:
                results.append({
                    "id": final_eval.id,
                    "student_email": final_eval.student_email,
                    "student_name": final_eval.student_name,
                    "project_title": final_eval.project_title,
                    "status": final_eval.status,
                    "viva_date": final_eval.viva_date,
                    "committee_count": len(final_eval.committee_members) if final_eval.committee_members else 0,
                    "weighted_average": final_eval.weighted_average,
                    "final_grade": final_eval.final_grade,
                    "approval_status": final_eval.approval_status,
                    "published_at": final_eval.published_at,
                    "created_at": final_eval.created_at,
                })
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving evaluations: {str(e)}")


# ==================== Student Endpoints ====================

@router.get("/api/final-evaluation/student/{student_email}")
def get_student_final_evaluation(
    student_email: str,
    session: Session = Depends(get_session),
):
    """Get student's own final evaluation results.
    
    Only returns evaluation if student has passed BOTH Stage 1 and Stage 2 interim evaluations.
    """
    try:
        from .models import InterimEvaluationMarks
        
        # Check if student has passed BOTH Stage 1 and Stage 2 interim evaluations
        stage1_marks = session.exec(
            select(InterimEvaluationMarks).where(
                and_(
                    InterimEvaluationMarks.student_email == student_email,
                    InterimEvaluationMarks.stage == 1
                )
            )
        ).first()
        
        stage2_marks = session.exec(
            select(InterimEvaluationMarks).where(
                and_(
                    InterimEvaluationMarks.student_email == student_email,
                    InterimEvaluationMarks.stage == 2
                )
            )
        ).first()
        
        # Only allow access if student has both stage 1 and stage 2 marks
        if not stage1_marks or not stage2_marks:
            raise HTTPException(
                status_code=403,
                detail="You are not eligible for final evaluation. Please complete both interim evaluation stages first."
            )
        
        # Get final evaluation for this student
        final_eval = session.exec(
            select(FinalEvaluationViva).where(
                FinalEvaluationViva.student_email == student_email
            )
        ).first()
        
        if not final_eval:
            raise HTTPException(status_code=404, detail="No final evaluation found for this student")
        
        # If not published, don't return marks (unless status is still in progress)
        if final_eval.status != "published":
            return {
                "id": final_eval.id,
                "student_email": final_eval.student_email,
                "student_name": final_eval.student_name,
                "project_title": final_eval.project_title,
                "status": final_eval.status,
                "viva_date": final_eval.viva_date,
                "message": "Final evaluation results are not yet available"
            }
        
        return {
            "id": final_eval.id,
            "student_email": final_eval.student_email,
            "student_name": final_eval.student_name,
            "project_title": final_eval.project_title,
            "status": final_eval.status,
            "viva_date": final_eval.viva_date,
            "viva_location": final_eval.viva_location,
            "committee_members": final_eval.committee_members,
            "committee_marks": final_eval.committee_marks,
            "weighted_average": final_eval.weighted_average,
            "final_grade": final_eval.final_grade,
            "published_at": final_eval.published_at,
            "created_at": final_eval.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving evaluation: {str(e)}")


# ==================== Utility Endpoints ====================

@router.post("/api/final-evaluation/{final_eval_id}/update-viva-schedule")
def update_viva_schedule(
    final_eval_id: int,
    viva_date: Optional[datetime] = None,
    viva_location: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """Update viva date and location."""
    try:
        final_eval = session.get(FinalEvaluationViva, final_eval_id)
        if not final_eval:
            raise HTTPException(status_code=404, detail="Final evaluation not found")
        
        if viva_date:
            final_eval.viva_date = viva_date
        if viva_location:
            final_eval.viva_location = viva_location
        
        final_eval.status = "scheduled"
        final_eval.updated_at = datetime.utcnow()
        session.add(final_eval)
        session.commit()
        session.refresh(final_eval)
        
        return {
            "success": True,
            "message": "Viva schedule updated successfully",
            "viva_date": final_eval.viva_date,
            "viva_location": final_eval.viva_location,
            "status": final_eval.status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating schedule: {str(e)}")
