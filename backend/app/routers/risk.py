from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.utils.timezone import utc_now
from app.database import get_db
from app.models.district import District
from app.models.risk import RiskAssessment
from app.models.alert import Alert
from app.schemas.risk import RiskAssessmentOut, DistrictRiskMatrixItem, NationalRiskOverview
from app.schemas.common import ApiResponse
from app.risk_engine.calculator import calculate_district_risk
from app.services.alert_service import evaluate_and_create_alerts
from app.security.permissions import require_role
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["Risk Engine"])

@router.get("/districts", response_model=ApiResponse[NationalRiskOverview])
def get_national_risk_overview(
    province: Optional[str] = Query(None),
    min_level: Optional[str] = Query(None, description="LOW, MODERATE, HIGH, VERY HIGH, CRITICAL"),
    db: Session = Depends(get_db)
):
    query = db.query(District)
    if province:
        query = query.filter(District.province.ilike(f"%{province}%"))

    districts = query.order_by(District.district_name.asc()).all()

    matrix_items: List[DistrictRiskMatrixItem] = []
    level_counts = {"CRITICAL": 0, "VERY HIGH": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    flood_high_plus = 0
    landslide_high_plus = 0
    agri_high_plus = 0

    for d in districts:
        latest_risk = db.query(RiskAssessment).filter(
            RiskAssessment.district_id == d.id
        ).order_by(RiskAssessment.calculated_at.desc()).first()

        alert_count = db.query(Alert).filter(
            Alert.district_id == d.id,
            Alert.status == "ACTIVE"
        ).count()

        overall_lvl = latest_risk.overall_risk_level if latest_risk else "LOW"
        overall_sc = latest_risk.overall_risk_score if latest_risk else 0.0
        flood_lvl = latest_risk.flood_risk_level if latest_risk else "LOW"
        landslide_lvl = latest_risk.landslide_risk_level if latest_risk else "LOW"
        agri_lvl = latest_risk.agriculture_risk_level if latest_risk else "LOW"

        # Count levels
        if overall_lvl in level_counts:
            level_counts[overall_lvl] += 1
        if flood_lvl in ["HIGH", "VERY HIGH", "CRITICAL"]:
            flood_high_plus += 1
        if landslide_lvl in ["HIGH", "VERY HIGH", "CRITICAL"]:
            landslide_high_plus += 1
        if agri_lvl in ["HIGH", "VERY HIGH"]:
            agri_high_plus += 1

        top_factor = "Normal seasonal conditions"
        if latest_risk and latest_risk.risk_factors:
            top_factor = latest_risk.risk_factors[0]

        item = DistrictRiskMatrixItem(
            district_id=d.id,
            district_name=d.district_name,
            province=d.province,
            overall_risk=overall_lvl,
            overall_score=overall_sc,
            flood_risk=flood_lvl,
            landslide_risk=landslide_lvl,
            rainfall_risk=latest_risk.rainfall_risk_level if latest_risk else "LOW",
            agriculture_risk=agri_lvl,
            top_factor=top_factor,
            confidence=latest_risk.confidence if latest_risk else "MEDIUM",
            active_alerts=alert_count,
            calculated_at=latest_risk.calculated_at if latest_risk else d.updated_at
        )

        # Filter by min_level if specified
        if min_level:
            level_order = ["LOW", "MODERATE", "HIGH", "VERY HIGH", "CRITICAL"]
            target_idx = level_order.index(min_level.upper()) if min_level.upper() in level_order else 0
            cur_idx = level_order.index(overall_lvl) if overall_lvl in level_order else 0
            if cur_idx >= target_idx:
                matrix_items.append(item)
        else:
            matrix_items.append(item)

    # Sort descending by overall risk score
    matrix_items.sort(key=lambda x: x.overall_score, reverse=True)

    overview = NationalRiskOverview(
        generated_at=utc_now(),
        total_districts=len(districts),
        critical_districts_count=level_counts["CRITICAL"],
        very_high_districts_count=level_counts["VERY HIGH"],
        high_districts_count=level_counts["HIGH"],
        moderate_districts_count=level_counts["MODERATE"],
        low_districts_count=level_counts["LOW"],
        flood_high_plus_count=flood_high_plus,
        landslide_high_plus_count=landslide_high_plus,
        agriculture_high_plus_count=agri_high_plus,
        districts=matrix_items
    )
    return ApiResponse(data=overview)

@router.get("/{district_id_or_name}", response_model=ApiResponse[RiskAssessmentOut])
def get_district_risk(district_id_or_name: str, db: Session = Depends(get_db)):
    if district_id_or_name.isdigit():
        district = db.query(District).filter(District.id == int(district_id_or_name)).first()
    else:
        district = db.query(District).filter(District.district_name.ilike(district_id_or_name)).first()

    if not district:
        raise HTTPException(status_code=404, detail="District not found.")

    risk = db.query(RiskAssessment).filter(
        RiskAssessment.district_id == district.id
    ).order_by(RiskAssessment.calculated_at.desc()).first()

    if not risk:
        # Compute dynamically
        risk_res = calculate_district_risk(district_name=district.district_name)
        risk = RiskAssessment(
            district_id=district.id,
            district_name=district.district_name,
            overall_risk_score=risk_res["overall_risk_score"],
            overall_risk_level=risk_res["overall_risk_level"],
            flood_risk_score=risk_res["flood_risk_score"],
            flood_risk_level=risk_res["flood_risk_level"],
            landslide_risk_score=risk_res["landslide_risk_score"],
            landslide_risk_level=risk_res["landslide_risk_level"],
            rainfall_risk_score=risk_res["rainfall_risk_score"],
            rainfall_risk_level=risk_res["rainfall_risk_level"],
            agriculture_risk_score=risk_res["agriculture_risk_score"],
            agriculture_risk_level=risk_res["agriculture_risk_level"],
            risk_factors=risk_res["risk_factors"],
            explanation=risk_res["explanation"],
            confidence=risk_res["confidence"],
            risk_engine_version=risk_res["risk_engine_version"],
            sources_used=risk_res["sources_used"],
            inputs_snapshot=risk_res["inputs_snapshot"],
            calculated_at=risk_res["calculated_at"],
            valid_until=risk_res["valid_until"]
        )
        db.add(risk)
        db.commit()
        db.refresh(risk)

    return ApiResponse(data=risk)

@router.post("/recalculate/{district_id}", response_model=ApiResponse[RiskAssessmentOut])
def recalculate_district_risk_endpoint(
    district_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR", "ANALYST"]))
):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found.")

    risk_res = calculate_district_risk(district_name=district.district_name)
    assessment = RiskAssessment(
        district_id=district.id,
        district_name=district.district_name,
        overall_risk_score=risk_res["overall_risk_score"],
        overall_risk_level=risk_res["overall_risk_level"],
        flood_risk_score=risk_res["flood_risk_score"],
        flood_risk_level=risk_res["flood_risk_level"],
        landslide_risk_score=risk_res["landslide_risk_score"],
        landslide_risk_level=risk_res["landslide_risk_level"],
        rainfall_risk_score=risk_res["rainfall_risk_score"],
        rainfall_risk_level=risk_res["rainfall_risk_level"],
        agriculture_risk_score=risk_res["agriculture_risk_score"],
        agriculture_risk_level=risk_res["agriculture_risk_level"],
        risk_factors=risk_res["risk_factors"],
        explanation=risk_res["explanation"],
        confidence=risk_res["confidence"],
        risk_engine_version=risk_res["risk_engine_version"],
        inputs_snapshot=risk_res["inputs_snapshot"],
        sources_used=risk_res["sources_used"],
        calculated_at=risk_res["calculated_at"],
        valid_until=risk_res["valid_until"]
    )
    db.add(assessment)
    evaluate_and_create_alerts(db, district, risk_res)
    db.commit()
    db.refresh(assessment)

    return ApiResponse(data=assessment)
