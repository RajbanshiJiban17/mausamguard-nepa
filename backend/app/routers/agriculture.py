from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.district import District
from app.models.agriculture import AgricultureRisk
from app.schemas.agriculture import AgricultureRiskOut, AgricultureOverview
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/agriculture-risk", tags=["Agriculture Risk"])

@router.get("", response_model=ApiResponse[AgricultureOverview])
def get_agriculture_overview(
    crop_risk_level: Optional[str] = Query(None, description="LOW, MODERATE, HIGH, VERY HIGH"),
    db: Session = Depends(get_db)
):
    query = db.query(AgricultureRisk)
    if crop_risk_level:
        query = query.filter(AgricultureRisk.crop_risk_level == crop_risk_level.upper())

    agri_records = query.order_by(desc(AgricultureRisk.risk_score)).all()

    high_risk_count = sum(1 for a in agri_records if a.crop_risk_level in ["HIGH", "VERY HIGH"])
    waterlogged_count = sum(1 for a in agri_records if a.soil_moisture_condition == "WATERLOGGED")
    deficit_count = sum(1 for a in agri_records if a.rainfall_stress_level == "DEFICIT")

    general_guidance = [
        "In Terai lowlands, ensure major irrigation feeder channels and field outlets are unobstructed.",
        "For middle-hill terraces, inspect retaining field bunds for signs of micro-slumping after intense downpours.",
        "Postpone synthetic fertilizer broadcasting when 24h precipitation forecast exceeds 40 mm to prevent wash-off.",
        "Elevate seed and grain storage bags at least 0.5 meters above ground level in flood-vulnerable catchments."
    ]

    overview = AgricultureOverview(
        national_crop_risk_summary=(
            f"National monitoring indicates {high_risk_count} districts with elevated crop/farming risk. "
            f"{waterlogged_count} districts show soil saturation or waterlogging risks."
        ),
        high_risk_districts_count=high_risk_count,
        waterlogged_districts_count=waterlogged_count,
        drought_or_deficit_districts_count=deficit_count,
        general_guidance=general_guidance,
        districts=agri_records
    )
    return ApiResponse(data=overview)

@router.get("/{district_id_or_name}", response_model=ApiResponse[AgricultureRiskOut])
def get_district_agriculture_risk(district_id_or_name: str, db: Session = Depends(get_db)):
    if district_id_or_name.isdigit():
        district = db.query(District).filter(District.id == int(district_id_or_name)).first()
    else:
        district = db.query(District).filter(District.district_name.ilike(district_id_or_name)).first()

    if not district:
        raise HTTPException(status_code=404, detail="District not found.")

    agri = db.query(AgricultureRisk).filter(
        AgricultureRisk.district_id == district.id
    ).order_by(desc(AgricultureRisk.calculated_at)).first()

    if not agri:
        raise HTTPException(status_code=404, detail="Agriculture assessment not available for this district.")

    return ApiResponse(data=agri)
