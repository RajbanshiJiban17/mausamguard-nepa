from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.river import RiverStation
from app.schemas.river import RiverStationOut, RiverOverview
from app.schemas.common import ApiResponse
from app.services.dhm_service import check_dhm_feed_status, get_station_readings

router = APIRouter(prefix="/river-stations", tags=["River Monitoring"])

@router.get("", response_model=ApiResponse[RiverOverview])
async def list_river_stations(
    basin: Optional[str] = Query(None, description="Koshi, Narayani, Gandaki, Karnali, Mahakali, West Rapti, Bagmati"),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Check live feed connectivity
    feed_info = await check_dhm_feed_status()
    station_data = get_station_readings(feed_info)

    # Filter
    filtered = []
    stations_danger = 0
    stations_warning = 0

    for st in station_data:
        if basin and basin.lower() not in st["basin"].lower():
            continue
        if district and district.lower() not in st["district"].lower():
            continue

        if st["status"] == "Above danger":
            stations_danger += 1
        elif st["status"] == "Above warning":
            stations_warning += 1

        filtered.append(RiverStationOut(
            id=len(filtered) + 1,
            station_id=st["station_id"],
            station_name=st["station_name"],
            river_name=st["river_name"],
            basin=st["basin"],
            district=st["district"],
            latitude=st["latitude"],
            longitude=st["longitude"],
            warning_level_m=st["warning_level_m"],
            danger_level_m=st["danger_level_m"],
            current_water_level=st["current_water_level"], # null/None per Requirement 10 & 75
            trend=st["trend"],
            status=st["status"],
            feed_status=st["feed_status"],
            distance_to_warning=st["distance_to_warning"],
            distance_to_danger=st["distance_to_danger"],
            last_updated=st["last_updated"],
            source=st["source"],
            notes=st["notes"]
        ))

    overview = RiverOverview(
        total_stations=len(filtered),
        stations_above_danger=stations_danger,
        stations_above_warning=stations_warning,
        feed_status_summary=feed_info["status_label"],
        stations=filtered
    )
    return ApiResponse(data=overview)

@router.get("/{station_id}", response_model=ApiResponse[RiverStationOut])
async def get_river_station_detail(station_id: str, db: Session = Depends(get_db)):
    feed_info = await check_dhm_feed_status()
    station_data = get_station_readings(feed_info)

    match = next((s for s in station_data if s["station_id"].lower() == station_id.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"River monitoring station '{station_id}' not found.")

    res = RiverStationOut(
        id=1,
        station_id=match["station_id"],
        station_name=match["station_name"],
        river_name=match["river_name"],
        basin=match["basin"],
        district=match["district"],
        latitude=match["latitude"],
        longitude=match["longitude"],
        warning_level_m=match["warning_level_m"],
        danger_level_m=match["danger_level_m"],
        current_water_level=match["current_water_level"],
        trend=match["trend"],
        status=match["status"],
        feed_status=match["feed_status"],
        distance_to_warning=match["distance_to_warning"],
        distance_to_danger=match["distance_to_danger"],
        last_updated=match["last_updated"],
        source=match["source"],
        notes=match["notes"]
    )
    return ApiResponse(data=res)
