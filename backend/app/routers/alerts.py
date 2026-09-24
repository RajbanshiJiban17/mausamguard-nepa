from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.timezone import utc_now
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertOut, AlertOverview, AlertResolveRequest
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.security.permissions import require_role, get_current_user
from app.models.user import User
import math

router = APIRouter(prefix="/alerts", tags=["Early Warnings & Alerts"])

@router.get("", response_model=ApiResponse[AlertOverview])
def get_active_alerts(
    hazard: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).filter(Alert.status == "ACTIVE")
    if hazard:
        query = query.filter(Alert.hazard == hazard)
    if priority:
        query = query.filter(Alert.priority == priority)
    if district:
        query = query.filter(Alert.district.ilike(f"%{district}%"))

    alerts = query.order_by(desc(Alert.score), desc(Alert.created_at)).all()

    crit = sum(1 for a in alerts if a.priority == "CRITICAL")
    high_w = sum(1 for a in alerts if a.priority == "HIGH WARNING")
    warn = sum(1 for a in alerts if a.priority == "WARNING")
    watch = sum(1 for a in alerts if a.priority == "WATCH")
    info = sum(1 for a in alerts if a.priority == "INFO")

    overview = AlertOverview(
        active_count=len(alerts),
        critical_count=crit,
        high_warning_count=high_w,
        warning_count=warn,
        watch_count=watch,
        info_count=info,
        alerts=alerts
    )
    return ApiResponse(data=overview)

@router.get("/history", response_model=PaginatedResponse[AlertOut])
def get_alert_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = Query(None, description="ACTIVE, EXPIRED, RESOLVED"),
    hazard: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status.upper())
    if hazard:
        query = query.filter(Alert.hazard == hazard)
    if district:
        query = query.filter(Alert.district.ilike(f"%{district}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    results = query.order_by(desc(Alert.created_at)).offset(offset).limit(page_size).all()

    return PaginatedResponse(
        data=results,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_records=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    )

@router.post("/{alert_id}/acknowledge", response_model=ApiResponse[AlertOut])
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return ApiResponse(data=alert)

@router.post("/{alert_id}/resolve", response_model=ApiResponse[AlertOut])
def resolve_alert(
    alert_id: str,
    payload: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"]))
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.status = "RESOLVED"
    alert.resolved_at = utc_now()
    alert.resolved_by = current_user.username
    alert.resolution_notes = payload.resolution_notes
    db.commit()
    db.refresh(alert)

    return ApiResponse(data=alert)
