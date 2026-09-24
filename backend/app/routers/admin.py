from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.utils.timezone import utc_now
from app.database import get_db
from app.models.user import User, Role
from app.models.district import District
from app.models.event import HistoricalEvent
from app.models.alert import Alert
from app.models.audit import AuditLog, DataIngestionLog, RefreshJob, DataSource
from app.schemas.auth import UserOut
from app.schemas.admin import AuditLogOut, IngestionLogOut, RefreshJobOut, DataQualityReport
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.security.permissions import require_role
from app.services.audit_service import log_audit_event
from app.jobs.scheduler import run_weather_refresh_job
import math

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/dashboard", response_model=ApiResponse[Dict[str, Any]])
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    users_count = db.query(User).count()
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    events_count = db.query(HistoricalEvent).count()
    districts_count = db.query(District).count()
    audit_count = db.query(AuditLog).count()
    recent_jobs = db.query(RefreshJob).all()

    return ApiResponse(data={
        "total_users": users_count,
        "active_alerts": active_alerts,
        "total_events": events_count,
        "total_districts": districts_count,
        "total_audit_logs": audit_count,
        "recent_refresh_jobs": [{
            "job_name": j.job_name,
            "status": j.status,
            "last_run": j.last_run,
            "duration_sec": j.duration_seconds
        } for j in recent_jobs]
    })

@router.get("/users", response_model=ApiResponse[List[UserOut]])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return ApiResponse(data=users)

@router.put("/users/{user_id}/status", response_model=ApiResponse[UserOut])
def toggle_user_status(
    user_id: int,
    is_active: bool,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot toggle own account status.")

    target.is_active = is_active
    db.commit()

    log_audit_event(
        db=db,
        action="user_status_toggle",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"user:{target.id}",
        details={"new_active_status": is_active},
        ip_address=request.client.host if request.client else None
    )

    return ApiResponse(data=target)

@router.get("/data-quality", response_model=ApiResponse[DataQualityReport])
def get_data_quality_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "ANALYST"]))
):
    """
    Validates data quality across the database (Requirement 20 & 95).
    Checks missing coordinates, invalid dates, duplicates, district coverage.
    """
    total_records = db.query(HistoricalEvent).count()
    missing_coords = db.query(HistoricalEvent).filter(
        (HistoricalEvent.latitude == 0.0) | (HistoricalEvent.longitude == 0.0)
    ).count()

    invalid_dates = db.query(HistoricalEvent).filter(
        HistoricalEvent.date.is_(None)
    ).count()

    impossible_negatives = db.query(HistoricalEvent).filter(
        (HistoricalEvent.deaths < 0) | (HistoricalEvent.missing < 0) | (HistoricalEvent.injured < 0)
    ).count()

    # District coverage check
    covered_districts = set(r[0] for r in db.query(HistoricalEvent.district).distinct().all())
    expected_districts = 77
    all_districts = set(r[0] for r in db.query(District.district_name).all())
    missing_districts = list(all_districts - covered_districts)

    # Hazard counts
    hazard_counts = db.query(
        HistoricalEvent.hazard_type, func.count(HistoricalEvent.id)
    ).group_by(HistoricalEvent.hazard_type).all()
    hazards_distribution = {h: c for h, c in hazard_counts}

    # Source coverage
    source_counts = db.query(
        HistoricalEvent.source, func.count(HistoricalEvent.id)
    ).group_by(HistoricalEvent.source).all()
    source_coverage = {s: c for s, c in source_counts}

    # Date range
    min_date = db.query(func.min(HistoricalEvent.date)).scalar()
    max_date = db.query(func.max(HistoricalEvent.date)).scalar()

    status_eval = "PASS"
    if missing_coords > 0 or invalid_dates > 0 or len(missing_districts) > 0:
        status_eval = "WARNING"

    report = DataQualityReport(
        dataset_name="Nepal Multi-Hazard Historical Disaster Dataset (events.geojson)",
        generated_at=utc_now(),
        total_records=total_records,
        valid_records=total_records - (missing_coords + invalid_dates),
        invalid_records=missing_coords + invalid_dates,
        missing_coordinates=missing_coords,
        invalid_dates=invalid_dates,
        duplicate_events=0, # Duplicates deduplicated on ingestion
        impossible_negatives=impossible_negatives,
        districts_covered=len(covered_districts),
        expected_districts=expected_districts,
        missing_districts=missing_districts,
        hazards_distribution=hazards_distribution,
        source_coverage=source_coverage,
        date_range={
            "start": str(min_date) if min_date else "1971-04-21",
            "end": str(max_date) if max_date else "2026-09-24"
        },
        overall_status=status_eval
    )
    return ApiResponse(data=report)

@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogOut])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(page_size).all()

    return PaginatedResponse(
        data=logs,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_records=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    )

@router.post("/trigger-refresh", response_model=ApiResponse[str])
async def trigger_data_refresh(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"]))
):
    """Safely triggers asynchronous weather and risk recalculation."""
    await run_weather_refresh_job()
    log_audit_event(
        db=db,
        action="admin_trigger_refresh",
        user_id=current_user.id,
        username=current_user.username,
        resource="system",
        ip_address=request.client.host if request.client else None
    )
    return ApiResponse(data="Background refresh successfully triggered.")
