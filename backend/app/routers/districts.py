import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database import get_db
from app.models.district import District, Municipality
from app.models.risk import RiskAssessment
from app.models.alert import Alert
from app.models.event import HistoricalEvent
from app.schemas.district import DistrictSummary, DistrictDetail, DistrictComparison
from app.schemas.common import ApiResponse
from app.services.dhm_service import DHM_BENCHMARK_STATIONS

router = APIRouter(prefix="/districts", tags=["Districts"])

# In-memory GeoJSON cache for blazing-fast map rendering (60-second TTL)
_GEOJSON_CACHE: Dict[str, Any] = {"data": None, "expires_at": 0.0}

def get_latest_risks_map(db: Session) -> Dict[int, RiskAssessment]:
    """Efficiently retrieve latest risk assessment per district without N+1 queries."""
    all_risks = db.query(RiskAssessment).order_by(RiskAssessment.calculated_at.desc()).all()
    latest_map = {}
    for r in all_risks:
        if r.district_id not in latest_map:
            latest_map[r.district_id] = r
    return latest_map

def get_active_alert_counts(db: Session) -> Dict[int, int]:
    """Retrieve active alert counts per district in a single grouped query."""
    rows = (
        db.query(Alert.district_id, func.count(Alert.id))
        .filter(Alert.status == "ACTIVE")
        .group_by(Alert.district_id)
        .all()
    )
    return {row[0]: row[1] for row in rows}

@router.get("", response_model=ApiResponse[List[DistrictSummary]])
def list_districts(
    province: Optional[str] = Query(None, description="Filter by province"),
    search: Optional[str] = Query(None, description="Search by district name"),
    db: Session = Depends(get_db)
):
    query = db.query(District)
    if province:
        query = query.filter(District.province.ilike(f"%{province}%"))
    if search:
        query = query.filter(District.district_name.ilike(f"%{search}%"))

    districts = query.order_by(District.district_name.asc()).all()

    # Batch retrieve risks and alert counts (Eliminates 154 N+1 queries)
    latest_risks_map = get_latest_risks_map(db)
    alert_counts_map = get_active_alert_counts(db)

    summaries = []
    for d in districts:
        latest_risk = latest_risks_map.get(d.id)
        active_alerts = alert_counts_map.get(d.id, 0)

        summary = DistrictSummary(
            id=d.id,
            district_name=d.district_name,
            pcode=d.pcode,
            province=d.province,
            latitude=d.latitude,
            longitude=d.longitude,
            area_sqkm=d.area_sqkm,
            population=d.population,
            total_events=d.total_events,
            total_deaths=d.total_deaths,
            total_missing=d.total_missing,
            total_injured=d.total_injured,
            houses_destroyed=d.houses_destroyed,
            people_affected=d.people_affected,
            deaths_per_100k=d.deaths_per_100k,
            hazard_breakdown=d.hazard_breakdown,
            current_overall_risk=latest_risk.overall_risk_level if latest_risk else "LOW",
            current_risk_score=latest_risk.overall_risk_score if latest_risk else 0.0,
            current_flood_risk=latest_risk.flood_risk_level if latest_risk else "LOW",
            current_landslide_risk=latest_risk.landslide_risk_level if latest_risk else "LOW",
            current_agriculture_risk=latest_risk.agriculture_risk_level if latest_risk else "LOW",
            active_alert_count=active_alerts,
            latest_rainfall_mm=0.0
        )
        summaries.append(summary)

    return ApiResponse(data=summaries)

@router.get("/geojson", response_model=ApiResponse[dict])
def get_all_districts_geojson(db: Session = Depends(get_db)):
    """Returns complete GeoJSON FeatureCollection of all 77 districts with current risk properties. Cached for 60s."""
    now = time.time()
    if _GEOJSON_CACHE["data"] is not None and now < _GEOJSON_CACHE["expires_at"]:
        return ApiResponse(data=_GEOJSON_CACHE["data"])

    districts = db.query(District).all()
    latest_risks_map = get_latest_risks_map(db)
    alert_counts_map = get_active_alert_counts(db)

    features = []
    for d in districts:
        if not d.geometry:
            continue
        latest_risk = latest_risks_map.get(d.id)
        alert_count = alert_counts_map.get(d.id, 0)

        features.append({
            "type": "Feature",
            "properties": {
                "id": d.id,
                "district": d.district_name,
                "district_name": d.district_name,
                "province": d.province,
                "population": d.population,
                "area_sqkm": d.area_sqkm,
                "total_events": d.total_events,
                "total_deaths": d.total_deaths,
                "overall_risk": latest_risk.overall_risk_level if latest_risk else "LOW",
                "risk_score": latest_risk.overall_risk_score if latest_risk else 0.0,
                "flood_risk": latest_risk.flood_risk_level if latest_risk else "LOW",
                "landslide_risk": latest_risk.landslide_risk_level if latest_risk else "LOW",
                "agriculture_risk": latest_risk.agriculture_risk_level if latest_risk else "LOW",
                "active_alerts": alert_count,
                "hazard_breakdown": d.hazard_breakdown
            },
            "geometry": d.geometry
        })

    result_data = {
        "type": "FeatureCollection",
        "features": features
    }
    _GEOJSON_CACHE["data"] = result_data
    _GEOJSON_CACHE["expires_at"] = now + 60.0  # 60s cache

    return ApiResponse(data=result_data)

@router.get("/compare", response_model=ApiResponse[DistrictComparison])
def compare_districts(
    ids: str = Query(..., description="Comma separated district IDs or names (e.g. 'Kathmandu,Rasuwa' or '1,2')"),
    db: Session = Depends(get_db)
):
    items = [x.strip() for x in ids.split(",") if x.strip()]
    details = []
    for item in items:
        if item.isdigit():
            d = db.query(District).filter(District.id == int(item)).first()
        else:
            d = db.query(District).filter(District.district_name.ilike(item)).first()
        if d:
            detail = build_district_detail(d, db)
            details.append(detail)

    return ApiResponse(data=DistrictComparison(districts=details))

@router.get("/{id_or_name}", response_model=ApiResponse[DistrictDetail])
def get_district_detail(id_or_name: str, db: Session = Depends(get_db)):
    if id_or_name.isdigit():
        district = db.query(District).filter(District.id == int(id_or_name)).first()
    else:
        district = db.query(District).filter(District.district_name.ilike(id_or_name)).first()

    if not district:
        raise HTTPException(status_code=404, detail=f"District '{id_or_name}' not found.")

    detail = build_district_detail(district, db)
    return ApiResponse(data=detail)

def build_district_detail(district: District, db: Session) -> DistrictDetail:
    latest_risk = db.query(RiskAssessment).filter(
        RiskAssessment.district_id == district.id
    ).order_by(RiskAssessment.calculated_at.desc()).first()

    active_alerts = db.query(Alert).filter(
        Alert.district_id == district.id,
        Alert.status == "ACTIVE"
    ).all()

    recent_events = db.query(HistoricalEvent).filter(
        HistoricalEvent.district_id == district.id
    ).order_by(HistoricalEvent.date.desc()).limit(15).all()

    # Find nearest river station from benchmarks
    nearest_station = None
    min_dist = float("inf")
    for st in DHM_BENCHMARK_STATIONS:
        dist_sq = (st["latitude"] - district.latitude)**2 + (st["longitude"] - district.longitude)**2
        if dist_sq < min_dist:
            min_dist = dist_sq
            nearest_station = st

    # Format alerts for response
    alert_dicts = [{
        "alert_id": a.alert_id,
        "hazard": a.hazard,
        "priority": a.priority,
        "risk_level": a.risk_level,
        "message": a.message,
        "created_at": a.created_at
    } for a in active_alerts]

    # Format events
    event_dicts = [{
        "event_id": ev.event_id,
        "date": str(ev.date),
        "hazard": ev.hazard_type,
        "title": ev.title,
        "deaths": ev.deaths,
        "missing": ev.missing,
        "injured": ev.injured,
        "houses_destroyed": ev.houses_destroyed,
        "source": ev.source
    } for ev in recent_events]

    return DistrictDetail(
        id=district.id,
        district_name=district.district_name,
        pcode=district.pcode,
        province=district.province,
        latitude=district.latitude,
        longitude=district.longitude,
        area_sqkm=district.area_sqkm,
        population=district.population,
        total_events=district.total_events,
        total_deaths=district.total_deaths,
        total_missing=district.total_missing,
        total_injured=district.total_injured,
        houses_destroyed=district.houses_destroyed,
        people_affected=district.people_affected,
        deaths_per_100k=district.deaths_per_100k,
        hazard_breakdown=district.hazard_breakdown,
        decade_breakdown=district.decade_breakdown,
        worst_event=district.worst_event,
        geometry=district.geometry,
        current_overall_risk=latest_risk.overall_risk_level if latest_risk else "LOW",
        current_risk_score=latest_risk.overall_risk_score if latest_risk else 0.0,
        current_flood_risk=latest_risk.flood_risk_level if latest_risk else "LOW",
        current_landslide_risk=latest_risk.landslide_risk_level if latest_risk else "LOW",
        current_agriculture_risk=latest_risk.agriculture_risk_level if latest_risk else "LOW",
        active_alert_count=len(active_alerts),
        latest_rainfall_mm=0.0,
        municipalities=district.municipalities[:12],
        recent_events=event_dicts,
        active_alerts=alert_dicts,
        nearest_river_station=nearest_station,
        risk_factors=latest_risk.risk_factors if latest_risk else [],
        risk_explanation=latest_risk.explanation if latest_risk else "Risk metrics baseline",
        last_updated=latest_risk.calculated_at if latest_risk else district.updated_at
    )
