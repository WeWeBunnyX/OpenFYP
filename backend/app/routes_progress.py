from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import select
from typing import List, Optional
from pathlib import Path
from datetime import datetime

from .models import ProgressLog, get_session, Session
from .utils import save_upload_file

router = APIRouter()


@router.get("/api/progress/logs")
def list_progress_logs(owner: str, session: Session = Depends(get_session)):
    """Return progress logs for a given owner (student email)."""
    if not owner:
        return {"logs": []}
    rows = session.exec(select(ProgressLog).where(ProgressLog.owner == owner)).all()

    def map_row(r: ProgressLog):
        return {
            "id": r.id,
            "owner": r.owner,
            "slot": r.slot,
            "title": r.title,
            "description": r.description,
            "fileUrl": r.file_url or (f"/api/progress/logs/{r.id}/download" if r.id else None),
            "signStatus": r.sign_status,
            "submittedAt": r.created_at.isoformat() if r.created_at else None,
        }

    return [map_row(r) for r in rows]


@router.post("/api/progress/logs")
async def create_progress_log(
    owner: str = Form(...),
    slot: int = Form(...),
    description: str = Form(...),
    title: Optional[str] = Form(None),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """Accept multipart form-data to create a progress log and store uploaded file on disk."""
    # validate slot
    try:
        slot_i = int(slot)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid slot")
    if slot_i < 1 or slot_i > 1000:
        # frontend expects 1..24, but allow reasonable upper bound
        raise HTTPException(status_code=400, detail="Slot out of range")

    # Save file
    try:
        meta = await save_upload_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")

    log = ProgressLog(
        owner=owner,
        slot=slot_i,
        title=title,
        description=description,
        file_path=meta.get("filepath"),
        mime_type=meta.get("mime_type"),
        created_at=datetime.utcnow(),
    )
    session.add(log)
    session.commit()
    session.refresh(log)

    # set a download URL
    log.file_url = f"/api/progress/logs/{log.id}/download"
    session.add(log)
    session.commit()
    session.refresh(log)

    return {
        "id": log.id,
        "owner": log.owner,
        "slot": log.slot,
        "title": log.title,
        "description": log.description,
        "fileUrl": log.file_url,
        "signStatus": log.sign_status,
        "submittedAt": log.created_at.isoformat() if log.created_at else None,
    }


@router.get("/api/progress/logs/supervisor")
def list_all_progress_logs(session: Session = Depends(get_session)):
    """Return all progress logs (for supervisor/admin viewing)."""
    rows = session.exec(select(ProgressLog).order_by(ProgressLog.owner, ProgressLog.slot)).all()

    def map_row(r: ProgressLog):
        return {
            "id": r.id,
            "owner": r.owner,
            "slot": r.slot,
            "title": r.title,
            "description": r.description,
            "fileUrl": r.file_url or (f"/api/progress/logs/{r.id}/download" if r.id else None),
            "signStatus": r.sign_status,
            "submittedAt": r.created_at.isoformat() if r.created_at else None,
        }

    return [map_row(r) for r in rows]


@router.patch("/api/progress/logs/{log_id}/sign")
def sign_progress_log(log_id: int, session: Session = Depends(get_session)):
    """Mark a progress log as signed by supervisor."""
    log = session.get(ProgressLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    log.sign_status = "signed"
    session.add(log)
    session.commit()
    session.refresh(log)

    return {
        "id": log.id,
        "owner": log.owner,
        "slot": log.slot,
        "title": log.title,
        "description": log.description,
        "fileUrl": log.file_url,
        "signStatus": log.sign_status,
        "submittedAt": log.created_at.isoformat() if log.created_at else None,
    }


@router.get("/api/progress/logs/{log_id}/download")
def download_progress_file(log_id: int, session: Session = Depends(get_session)):
    log = session.get(ProgressLog, log_id)
    if not log or not log.file_path:
        raise HTTPException(status_code=404, detail="Not found")

    p = Path(log.file_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=str(p), filename=Path(log.file_path).name, media_type=log.mime_type or "application/octet-stream")
