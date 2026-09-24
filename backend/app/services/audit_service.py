import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, SystemLog
from app.utils.timezone import utc_now

logger = logging.getLogger("mausamguard.audit")

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    resource: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS"
):
    try:
        log_entry = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
            status=status,
            timestamp=utc_now()
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")

def log_system_event(
    db: Session,
    level: str,
    module: str,
    message: str,
    request_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    try:
        sys_entry = SystemLog(
            level=level,
            module=module,
            message=message,
            request_id=request_id,
            details=details,
            timestamp=utc_now()
        )
        db.add(sys_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record system log: {e}")
