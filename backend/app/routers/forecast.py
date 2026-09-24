from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.district import District
from app.schemas.weather import WeatherForecastOut, ForecastHorizonItem
from app.schemas.common import ApiResponse
from app.services.weather_service import fetch_open_meteo_weather

router = APIRouter(prefix="/forecast", tags=["Weather Forecast"])

@router.get("/{district_id_or_name}", response_model=ApiResponse[WeatherForecastOut])
async def get_district_forecast(district_id_or_name: str, db: Session = Depends(get_db)):
    if district_id_or_name.isdigit():
        district = db.query(District).filter(District.id == int(district_id_or_name)).first()
    else:
        district = db.query(District).filter(District.district_name.ilike(district_id_or_name)).first()

    if not district:
        raise HTTPException(status_code=404, detail=f"District '{district_id_or_name}' not found.")

    weather_data = await fetch_open_meteo_weather(
        latitude=district.latitude,
        longitude=district.longitude,
        district_name=district.district_name
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
        horizons=horizons,
        hourly_series=weather_data.get("hourly_series", []),
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
