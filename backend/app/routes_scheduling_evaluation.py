from fastapi import APIRouter, Response, status, Header, Depends, Body
from sqlmodel import select
from datetime import datetime, timedelta
from typing import List

from .models import (
    User,
    Registration,
    Scheduling,
    InterimScheduling,
    ProposalEvaluation,
    get_session,
)
from .utils import _parse_iso_datetime, push_notification_db

router = APIRouter()


@router.post("/schedule")
def create_schedule(data: dict, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can schedule defenses"}

    start_iso = data.get("start")
    end_iso = data.get("end")
    slot_minutes = data.get("slot_minutes")
    committee_pool = data.get("committee_pool") or []
    registration_ids = data.get("registration_ids") or []

    if not start_iso or not registration_ids or not isinstance(registration_ids, list):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Missing start time or registration_ids"}

    start_dt = _parse_iso_datetime(start_iso)
    end_dt = _parse_iso_datetime(end_iso) if end_iso else None
    if not start_dt:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Invalid start datetime"}

    created = []
    updated_regs = []
    current_start = start_dt
    try:
        slot_mins = int(slot_minutes) if slot_minutes is not None else None
    except Exception:
        slot_mins = None

    for rid in registration_ids:
        try:
            reg = session.get(Registration, rid)
            if not reg:
                continue

            sched_start = current_start
            if slot_mins and slot_mins > 0:
                sched_end = sched_start + timedelta(minutes=slot_mins)
            else:
                sched_end = end_dt or sched_start

            sched = Scheduling(
                registration_id=reg.id,
                title=reg.title,
                proposal=reg.abstract,
                student_email=reg.owner,
                start=sched_start,
                end=sched_end,
                slot_minutes=slot_mins,
                committee=committee_pool,
            )
            session.add(sched)

            reg.defense = {"start": sched_start.isoformat(), "end": (sched_end.isoformat() if sched_end else None), "committee": committee_pool}
            session.add(reg)

            try:
                reg.status = "scheduled"
            except Exception:
                pass

            reg.history = reg.history or []
            reg.history.append({"actor": x_user_email, "action": "scheduled", "note": f"Scheduled defense with committee: {', '.join(committee_pool)}", "at": datetime.utcnow().isoformat()})

            push_notification_db(session, reg.owner, f"Your defense for '{reg.title}' has been scheduled at {sched_start.isoformat()}")

            created.append(sched)
            updated_regs.append(reg)

            # create or update ProposalEvaluation
            try:
                pe = session.exec(select(ProposalEvaluation).where(ProposalEvaluation.registration_id == reg.id)).first()
                if not pe:
                    pe = ProposalEvaluation(
                        registration_id=reg.id,
                        student_email=reg.owner,
                        scheduled_start=sched_start,
                        scheduled_end=sched_end,
                        status="pending",
                    )
                    session.add(pe)
                else:
                    pe.scheduled_start = sched_start
                    pe.scheduled_end = sched_end
                    session.add(pe)
            except Exception as e:
                print("Failed to create/update ProposalEvaluation:", e)

            if slot_mins and slot_mins > 0:
                current_start = sched_end
        except Exception as e:
            print("Scheduling error for reg", rid, e)

    session.commit()

    return {"message": "Scheduled", "scheduling": [c.dict() for c in created], "updated_registrations": [r.dict() for r in updated_regs]}


@router.post("/interim_schedule")
def create_interim_schedule(data: dict, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can schedule interim evaluations"}

    start_iso = data.get("start")
    end_iso = data.get("end")
    slot_minutes = data.get("slot_minutes")
    evaluators = data.get("evaluators") or []
    registration_ids = data.get("registration_ids") or []

    if not start_iso or not registration_ids or not isinstance(registration_ids, list):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Missing start time or registration_ids"}

    start_dt = _parse_iso_datetime(start_iso)
    end_dt = _parse_iso_datetime(end_iso) if end_iso else None
    if not start_dt:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Invalid start datetime"}

    created = []
    updated_regs = []
    current_start = start_dt
    try:
        slot_mins = int(slot_minutes) if slot_minutes is not None else None
    except Exception:
        slot_mins = None

    for rid in registration_ids:
        try:
            reg = session.get(Registration, rid)
            if not reg:
                continue

            sched_start = current_start
            sched_end = (sched_start + timedelta(minutes=slot_mins)) if (slot_mins and slot_mins > 0) else (end_dt or sched_start)

            interim = InterimScheduling(
                registration_id=reg.id,
                title=reg.title,
                notes=reg.abstract,
                student_email=reg.owner,
                start=sched_start,
                end=sched_end,
                slot_minutes=slot_mins,
                evaluators=evaluators,
            )
            session.add(interim)

            reg.history = reg.history or []
            reg.history.append({"actor": x_user_email, "action": "interim_scheduled", "note": f"Interim scheduled with evaluators: {', '.join(evaluators)}", "at": datetime.utcnow().isoformat()})
            session.add(reg)

            push_notification_db(session, reg.owner, f"Your interim evaluation for '{reg.title}' has been scheduled at {sched_start.isoformat()}")

            created.append(interim)
            updated_regs.append(reg)

            if slot_mins and slot_mins > 0:
                current_start = sched_end
        except Exception as e:
            print("Interim schedule error for reg", rid, e)

    session.commit()
    return {"message": "Interim Scheduled", "interim_scheduling": [c.dict() for c in created], "updated_registrations": [r.dict() for r in updated_regs]}


@router.get("/schedules")
def list_schedules(x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return {"schedules": []}

    try:
        if user.role == "Coordinator":
            rows = session.exec(select(Scheduling)).all()
        elif user.role == "Student":
            rows = session.exec(select(Scheduling).where(Scheduling.student_email == x_user_email)).all()
        elif user.role == "Supervisor":
            rows = session.exec(select(Scheduling).join(Registration, Scheduling.registration_id == Registration.id).where(Registration.supervisor == x_user_email)).all()
        else:
            rows = []
    except Exception as e:
        print("Error listing schedules:", e)
        rows = []

    def map_row(s: Scheduling):
        return {
            "id": s.id,
            "registration_id": s.registration_id,
            "title": s.title,
            "proposal": s.proposal,
            "student_email": s.student_email,
            "status": s.status,
            "start": s.start.isoformat() if s.start else None,
            "end": s.end.isoformat() if s.end else None,
            "slot_minutes": s.slot_minutes,
            "committee": s.committee,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }

    return {"schedules": [map_row(s) for s in rows]}


@router.get("/interim_schedules")
def list_interim_schedules(x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return {"interim_schedules": []}

    try:
        if user.role == "Coordinator":
            rows = session.exec(select(InterimScheduling)).all()
        elif user.role == "Student":
            rows = session.exec(select(InterimScheduling).where(InterimScheduling.student_email == x_user_email)).all()
        elif user.role == "Supervisor":
            rows = session.exec(select(InterimScheduling).join(Registration, InterimScheduling.registration_id == Registration.id).where(Registration.supervisor == x_user_email)).all()
        else:
            rows = []
    except Exception as e:
        print("Error listing interim schedules:", e)
        rows = []

    def map_row(s: InterimScheduling):
        return {
            "id": s.id,
            "registration_id": s.registration_id,
            "title": s.title,
            "notes": s.notes,
            "student_email": s.student_email,
            "status": s.status,
            "start": s.start.isoformat() if s.start else None,
            "end": s.end.isoformat() if s.end else None,
            "slot_minutes": s.slot_minutes,
            "evaluators": s.evaluators,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }

    return {"interim_schedules": [map_row(s) for s in rows]}


@router.get("/proposal_evaluations")
def list_proposal_evaluations(x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        return {"proposal_evaluations": []}

    try:
        if user.role == "Coordinator":
            rows = session.exec(select(ProposalEvaluation)).all()
        elif user.role == "Student":
            rows = session.exec(select(ProposalEvaluation).where(ProposalEvaluation.student_email == x_user_email)).all()
        elif user.role == "Supervisor":
            rows = session.exec(select(ProposalEvaluation).join(Registration, ProposalEvaluation.registration_id == Registration.id).where(Registration.supervisor == x_user_email)).all()
        else:
            rows = []
    except Exception as e:
        print("Error listing proposal evaluations:", e)
        rows = []

    def map_row(e: ProposalEvaluation):
        return {
            "id": e.id,
            "registration_id": e.registration_id,
            "student_email": e.student_email,
            "scheduled_start": e.scheduled_start.isoformat() if e.scheduled_start else None,
            "scheduled_end": e.scheduled_end.isoformat() if e.scheduled_end else None,
            "status": e.status,
            "result": e.result,
            "remarks": e.remarks,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
        }

    return {"proposal_evaluations": [map_row(r) for r in rows]}


@router.patch("/proposal_evaluations/{pe_id}")
def patch_proposal_evaluation(pe_id: int, data: dict = Body(None), response: Response = None, x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can record evaluation results"}

    pe = session.get(ProposalEvaluation, pe_id)
    if not pe:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "ProposalEvaluation not found"}

    reg = session.get(Registration, pe.registration_id) if pe.registration_id else None
    if not reg:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Associated registration not found"}

    if not (reg.defense or reg.status in ("scheduled", "registered")):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Can only record evaluations for assigned or scheduled registrations"}

    result = None
    remarks = None
    if isinstance(data, dict):
        result = data.get("result")
        remarks = data.get("remarks")

    if result not in ("approved", "rejected"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Invalid result; must be 'approved' or 'rejected'"}

    pe.result = result
    pe.remarks = remarks
    pe.status = "evaluated"
    pe.updated_at = datetime.utcnow()
    session.add(pe)

    reg.history = reg.history or []
    note = f"Proposal {result} by committee"
    if remarks:
        note = f"{note}: {remarks}"
    reg.history.append({"actor": x_user_email, "action": "evaluated", "note": note, "at": datetime.utcnow().isoformat()})
    session.add(reg)

    push_notification_db(session, reg.owner, f"Your proposal '{reg.title}' was {result} by committee. Remarks: {remarks or ''}")

    session.commit()
    session.refresh(pe)
    return {"message": "Saved", "proposal_evaluation": {"id": pe.id, "registration_id": pe.registration_id, "result": pe.result, "remarks": pe.remarks, "status": pe.status, "updated_at": pe.updated_at.isoformat() if pe.updated_at else None}}


@router.delete("/proposal_evaluations/{pe_id}")
def delete_proposal_evaluation(pe_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    """Delete a proposal evaluation record (Coordinator only)."""
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can delete evaluation records"}

    pe = session.get(ProposalEvaluation, pe_id)
    if not pe:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "ProposalEvaluation not found"}

    session.delete(pe)
    session.commit()
    return {"message": "Evaluation deleted successfully"}


@router.delete("/schedules/{sched_id}")
def delete_schedule(sched_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Unauthorized"}

    if user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can delete schedules"}

    sched = session.get(Scheduling, sched_id)
    if not sched:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    if sched.registration_id:
        reg = session.get(Registration, sched.registration_id)
        if reg:
            try:
                reg.defense = None
                if reg.status == "scheduled":
                    reg.status = "registered"
                reg.history = reg.history or []
                reg.history.append({"actor": x_user_email, "action": "unscheduled", "note": "Schedule deleted by coordinator", "at": datetime.utcnow().isoformat()})
                session.add(reg)
            except Exception as e:
                print("Failed updating registration during schedule delete:", e)

    try:
        session.delete(sched)
    except Exception as e:
        print("Failed to delete schedule:", e)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"message": "Delete failed"}

    try:
        if sched.student_email:
            push_notification_db(session, sched.student_email, f"Your schedule (id={sched.id}) was deleted by {x_user_email}")
    except Exception:
        pass

    session.commit()
    return {"message": "Deleted"}


@router.delete("/interim_schedules/{sched_id}")
def delete_interim_schedule(sched_id: int, response: Response, x_user_email: str = Header(None, alias="X-User-Email"), session=Depends(get_session)):
    user = session.get(User, x_user_email)
    if not user or user.role != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can delete interim schedules"}

    sched = session.get(InterimScheduling, sched_id)
    if not sched:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "Not found"}

    if sched.registration_id:
        reg = session.get(Registration, sched.registration_id)
        if reg:
            try:
                reg.history = reg.history or []
                reg.history.append({"actor": x_user_email, "action": "interim_unscheduled", "note": "Interim schedule deleted by coordinator", "at": datetime.utcnow().isoformat()})
                session.add(reg)
            except Exception as e:
                print("Failed updating registration during interim delete:", e)

    try:
        session.delete(sched)
    except Exception as e:
        print("Failed to delete interim schedule:", e)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"message": "Delete failed"}

    session.commit()
    return {"message": "Deleted"}
