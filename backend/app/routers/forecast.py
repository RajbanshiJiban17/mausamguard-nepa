from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.district import District
from app.schemas.weather import WeatherForecastOut, ForecastHorizonItem
from app.schemas.common import ApiResponse
from app.services.weather_service import fetch_open_meteo_weather

from app.services.palika_service import get_palika_coords, get_palikas_for_district

router = APIRouter(prefix="/forecast", tags=["Weather Forecast"])

@router.get("/{district_id_or_name}/palikas", response_model=ApiResponse[List[dict]])
async def get_district_palikas(district_id_or_name: str, db: Session = Depends(get_db)):
    """Returns all local governments (palikas/municipalities) for the given district."""
    if district_id_or_name.isdigit():
        district = db.query(District).filter(District.id == int(district_id_or_name)).first()
    else:
        district = db.query(District).filter(District.district_name.ilike(district_id_or_name)).first()

    if not district:
        raise HTTPException(status_code=404, detail=f"District '{district_id_or_name}' not found.")

    palikas = get_palikas_for_district(district.district_name)
    return ApiResponse(data=palikas)

@router.get("/{district_id_or_name}", response_model=ApiResponse[WeatherForecastOut])
async def get_district_forecast(
    district_id_or_name: str,
    palika: Optional[str] = Query(None, description="Local Government / Palika name (e.g. 'Joshipur', 'Bhajani')"),
    days: int = Query(7, ge=1, le=7, description="Forecast days (1 to 7)"),
    db: Session = Depends(get_db)
):
    if district_id_or_name.isdigit():
        district = db.query(District).filter(District.id == int(district_id_or_name)).first()
    else:
        district = db.query(District).filter(District.district_name.ilike(district_id_or_name)).first()

    if not district:
        raise HTTPException(status_code=404, detail=f"District '{district_id_or_name}' not found.")

    target_lat = district.latitude
    target_lon = district.longitude
    resolved_palika = None

    if palika and palika.strip():
        coords = get_palika_coords(district.district_name, palika.strip())
        if coords:
            target_lat, target_lon = coords
            resolved_palika = palika.strip()

    weather_data = await fetch_open_meteo_weather(
        latitude=target_lat,
        longitude=target_lon,
        location_name=district.district_name,
        forecast_days=days,
        palika_name=resolved_palika
    )

    horizons = [
        ForecastHorizonItem(
            horizon_hours=h["horizon_hours"],
            precipitation_sum=h["precipitation_sum"],
            temperature=h.get("temperature"),
            soil_moisture=h.get("soil_moisture")
        ) for h in weather_data.get("horizons", [])
    ]

    res = WeatherForecastOut(
        district_name=district.district_name,
        palika_name=resolved_palika,
        latitude=target_lat,
        longitude=target_lon,
        horizons=horizons,
        daily_forecast=weather_data.get("daily_forecast", []),
        hourly_series=weather_data.get("hourly_series", []),
        total_7d_rainfall_mm=weather_data.get("total_7d_rainfall_mm", 0.0),
        source=weather_data.get("source", "Open-Meteo"),
        retrieved_at=weather_data.get("retrieved_at")
    )
    return ApiResponse(data=res)

@router.get("/summary/national", response_model=ApiResponse[dict])
async def get_national_forecast_summary(db: Session = Depends(get_db)):
    """Sample key representative regional districts across Nepal for national outlook."""
    sample_names = ["Jhapa", "Kathmandu", "Kaski", "Banke", "Kailali", "Jumla"]
    regional_forecasts = []

    for name in sample_names:
        d = db.query(District).filter(District.district_name == name).first()
        if d:
            w = await fetch_open_meteo_weather(d.latitude, d.longitude, d.district_name)
            current = w.get("current", {})
            h24 = next((h["precipitation_sum"] for h in w.get("horizons", []) if h["horizon_hours"] == 24), 0.0)
            regional_forecasts.append({
                "district": d.district_name,
                "province": d.province,
                "temp": current.get("temperature_2m"),
                "rain_now": current.get("precipitation", 0.0),
                "forecast_24h_mm": h24,
                "status": w.get("status", "LIVE")
            })

    return ApiResponse(data={
        "regional_outlook": regional_forecasts,
        "source": "Open-Meteo Numerical Weather Prediction Models",
        "reference": "GFS / ECMWF ensemble synoptic grid"
    })
