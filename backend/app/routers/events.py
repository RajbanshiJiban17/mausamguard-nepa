import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.database import get_db
from app.models.event import HistoricalEvent
from app.models.district import District
from app.schemas.event import HistoricalEventOut, EventStatsSummary, YearlyTrendItem, MonthlyTrendItem
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/events", tags=["Historical Events"])

@router.get("", response_model=PaginatedResponse[HistoricalEventOut])
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    hazard: Optional[str] = Query(None, description="flood, landslide, avalanche, flash_flood"),
    district: Optional[str] = Query(None),
    year_min: Optional[int] = Query(None),
    year_max: Optional[int] = Query(None),
    min_deaths: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("date", description="date, deaths, severity_score"),
    sort_order: str = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db)
):
    query = db.query(HistoricalEvent)

    if hazard:
        query = query.filter(HistoricalEvent.hazard_type.ilike(f"%{hazard}%"))
    if district:
        query = query.filter(HistoricalEvent.district.ilike(f"%{district}%"))
    if year_min:
        query = query.filter(HistoricalEvent.year >= year_min)
    if year_max:
        query = query.filter(HistoricalEvent.year <= year_max)
    if min_deaths:
        query = query.filter(HistoricalEvent.deaths >= min_deaths)
    if source:
        query = query.filter(HistoricalEvent.source.ilike(f"%{source}%"))
    if search:
        query = query.filter(
            (HistoricalEvent.title.ilike(f"%{search}%")) |
            (HistoricalEvent.district.ilike(f"%{search}%")) |
            (HistoricalEvent.municipality.ilike(f"%{search}%"))
        )

    # Sorting
    sort_column = getattr(HistoricalEvent, sort_by, HistoricalEvent.date)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total_records = query.count()
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1
    offset = (page - 1) * page_size

    events = query.offset(offset).limit(page_size).all()

    return PaginatedResponse(
        data=events,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_records=total_records,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    )

@router.get("/geojson", response_model=ApiResponse[dict])
def get_events_geojson(
    hazard: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    year_min: Optional[int] = Query(None),
    limit: int = Query(1500, ge=10, le=5000, description="Max points to return for map performance"),
    db: Session = Depends(get_db)
):
    """
    Optimized GeoJSON representation of historical events for vector/clustered map layers.
    Includes geo_precision so the UI knows if location is exact or approximate.
    """
    query = db.query(HistoricalEvent)
    if hazard:
        query = query.filter(HistoricalEvent.hazard_type.ilike(f"%{hazard}%"))
    if district:
        query = query.filter(HistoricalEvent.district.ilike(f"%{district}%"))
    if year_min:
        query = query.filter(HistoricalEvent.year >= year_min)

    # Prioritize higher severity and recent events for map view
    events = query.order_by(desc(HistoricalEvent.severity_score), desc(HistoricalEvent.date)).limit(limit).all()

    features = []
    for ev in events:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ev.longitude, ev.latitude]
            },
            "properties": {
                "id": ev.event_id,
                "hazard": ev.hazard_type,
                "date": str(ev.date),
                "district": ev.district,
                "palika": ev.municipality,
                "deaths": ev.deaths,
                "missing": ev.missing,
                "injured": ev.injured,
                "houses_destroyed": ev.houses_destroyed,
                "severity_score": ev.severity_score,
                "geo_precision": ev.geo_precision,
                "source": ev.source,
                "title": ev.title
            }
        })

    return ApiResponse(data={
        "type": "FeatureCollection",
        "features": features
    })

@router.get("/stats/summary", response_model=ApiResponse[EventStatsSummary])
def get_events_stats_summary(db: Session = Depends(get_db)):
    total_events = db.query(HistoricalEvent).count()
    if total_events == 0:
        return ApiResponse(data=EventStatsSummary(
            total_events=0, total_deaths=0, total_missing=0, total_injured=0,
            total_houses_destroyed=0, total_people_affected=0,
            by_hazard={}, by_source={}, by_province={}, date_range={"min": "", "max": ""}
        ))

    deaths = db.query(func.sum(HistoricalEvent.deaths)).scalar() or 0
    missing = db.query(func.sum(HistoricalEvent.missing)).scalar() or 0
    injured = db.query(func.sum(HistoricalEvent.injured)).scalar() or 0
    houses = db.query(func.sum(HistoricalEvent.houses_destroyed)).scalar() or 0
    affected = db.query(func.sum(HistoricalEvent.people_affected)).scalar() or 0

    # Group by hazard
    hazard_counts = db.query(HistoricalEvent.hazard_type, func.count(HistoricalEvent.id)).group_by(HistoricalEvent.hazard_type).all()
    by_hazard = {h: cnt for h, cnt in hazard_counts}

    # Group by source
    source_counts = db.query(HistoricalEvent.source, func.count(HistoricalEvent.id)).group_by(HistoricalEvent.source).all()
    by_source = {s: cnt for s, cnt in source_counts}

    # Min and max date
    min_date = db.query(func.min(HistoricalEvent.date)).scalar()
    max_date = db.query(func.max(HistoricalEvent.date)).scalar()

    return ApiResponse(data=EventStatsSummary(
        total_events=total_events,
        total_deaths=int(deaths),
        total_missing=int(missing),
        total_injured=int(injured),
        total_houses_destroyed=int(houses),
        total_people_affected=int(affected),
        by_hazard=by_hazard,
        by_source=by_source,
        by_province={},
        date_range={"min": str(min_date) if min_date else "", "max": str(max_date) if max_date else ""}
    ))

@router.get("/stats/yearly", response_model=ApiResponse[List[YearlyTrendItem]])
def get_yearly_trends(db: Session = Depends(get_db)):
    results = db.query(
        HistoricalEvent.year,
        func.count(HistoricalEvent.id).label("cnt"),
        func.sum(HistoricalEvent.deaths).label("deaths"),
        func.sum(HistoricalEvent.missing).label("missing"),
        func.sum(HistoricalEvent.injured).label("injured")
    ).group_by(HistoricalEvent.year).order_by(HistoricalEvent.year.asc()).all()

    trends = []
    for r in results:
        # Count flood vs landslide
        floods = db.query(HistoricalEvent).filter(HistoricalEvent.year == r.year, HistoricalEvent.hazard_type == "flood").count()
        landslides = db.query(HistoricalEvent).filter(HistoricalEvent.year == r.year, HistoricalEvent.hazard_type == "landslide").count()
        avalanches = db.query(HistoricalEvent).filter(HistoricalEvent.year == r.year, HistoricalEvent.hazard_type == "avalanche").count()

        trends.append(YearlyTrendItem(
            year=r.year,
            event_count=r.cnt,
            deaths=int(r.deaths or 0),
            missing=int(r.missing or 0),
            injured=int(r.injured or 0),
            flood_count=floods,
            landslide_count=landslides,
            avalanche_count=avalanches
        ))

    return ApiResponse(data=trends)

@router.get("/stats/monthly", response_model=ApiResponse[List[MonthlyTrendItem]])
def get_monthly_trends(db: Session = Depends(get_db)):
    month_names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    results = db.query(
        HistoricalEvent.month,
        func.count(HistoricalEvent.id).label("cnt"),
        func.sum(HistoricalEvent.deaths).label("deaths")
    ).filter(HistoricalEvent.month.isnot(None)).group_by(HistoricalEvent.month).order_by(HistoricalEvent.month.asc()).all()

    items = []
    for r in results:
        m = r.month or 1
        items.append(MonthlyTrendItem(
            month=m,
            month_name=month_names[m] if m < len(month_names) else f"Month {m}",
            event_count=r.cnt,
            avg_events=round(r.cnt / 55.0, 1), # ~55 years baseline
            deaths=int(r.deaths or 0)
        ))

    return ApiResponse(data=items)

@router.get("/{event_id}", response_model=ApiResponse[HistoricalEventOut])
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    ev = db.query(HistoricalEvent).filter(HistoricalEvent.event_id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Disaster event '{event_id}' not found.")
    return ApiResponse(data=ev)
