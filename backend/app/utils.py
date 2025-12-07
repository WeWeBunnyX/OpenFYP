import base64
import uuid
from pathlib import Path
import mimetypes
from datetime import datetime
from typing import Optional
from sqlmodel import Session
from .models import Notification
import os


def push_notification_db(session: Session, email: str, message: str):
    if not email:
        return
    note = Notification(user_email=email, message=message)
    session.add(note)


def _save_attachment_file(base64_data: str, original_name: str) -> dict:
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


def _parse_iso_datetime(s: Optional[str]):
    if not s:
        return None
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s)
    except Exception:
        return None
