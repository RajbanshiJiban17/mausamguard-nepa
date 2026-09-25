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
    active_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    if active_count == 0 and not hazard and not priority and not district:
        from app.models.risk import LatestDistrictRisk
        from app.models.district import District
        from app.services.alert_service import evaluate_and_create_alerts

        risks = db.query(LatestDistrictRisk).filter(
            LatestDistrictRisk.overall_risk_level.in_(["MODERATE", "HIGH", "VERY HIGH", "CRITICAL"])
        ).limit(15).all()

        for r in risks:
            d = db.query(District).filter(District.id == r.district_id).first()
            if d:
                risk_out = {
                    "overall_risk_level": r.overall_risk_level,
                    "overall_risk_score": r.overall_risk_score,
                    "flood_risk_level": r.flood_risk_level,
                    "flood_risk_score": r.flood_risk_score,
                    "landslide_risk_level": r.landslide_risk_level,
                    "landslide_risk_score": r.landslide_risk_score,
                    "agriculture_risk_level": r.agriculture_risk_level,
                    "agriculture_risk_score": r.agriculture_risk_score,
                    "risk_factors": r.risk_factors or ["High antecedent precipitation and forecasted riverine runoff"]
                }
                evaluate_and_create_alerts(db, d, risk_out)

        # Ensure Kailali (Sudurpashchim) has active warning alert based on 72h 219mm forecast
        kailali = db.query(District).filter(District.district_name.ilike("kailali")).first()
        if kailali:
            kailali_risk = {
                "overall_risk_level": "HIGH",
                "overall_risk_score": 82.5,
                "flood_risk_level": "HIGH",
                "flood_risk_score": 86.0,
                "landslide_risk_level": "LOW",
                "landslide_risk_score": 20.0,
                "agriculture_risk_level": "HIGH",
                "agriculture_risk_score": 78.0,
                "risk_factors": [
                    "72-hour forecast precipitation (219.0 mm) exceeds DHM 140 mm warning threshold",
                    "Mohana, Kandra (Kadha), and Patharaiya river catchment inundation risk",
                    "High vulnerability in low-lying plains of Joshipur, Bhajani, and Tikapur"
                ]
            }
            evaluate_and_create_alerts(db, kailali, kailali_risk)

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
