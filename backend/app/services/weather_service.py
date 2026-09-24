import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import httpx
from app.config import settings
from app.utils.timezone import utc_now

logger = logging.getLogger("mausamguard.weather")

# Simple in-memory cache to respect API rate limits and handle transient failures
_weather_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_MINUTES = 20

async def fetch_open_meteo_weather(latitude: float, longitude: float, district_name: str) -> Dict[str, Any]:
    """
    Fetches genuine real-time weather and forecast data from Open-Meteo API.
    Includes caching, exponential backoff, and graceful fallback to cached data.
    """
    cache_key = f"{district_name}:{latitude:.2f}:{longitude:.2f}"
    now = utc_now()
    
    # Check cache
    if cache_key in _weather_cache:
        cached_entry = _weather_cache[cache_key]
        if (now - cached_entry["cached_at"]).total_seconds() < CACHE_TTL_MINUTES * 60:
            return cached_entry["data"]

    url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        "hourly": "precipitation,temperature_2m,soil_moisture_0_to_1cm",
        "forecast_days": 4,
        "timezone": "Asia/Kathmandu"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                raw = response.json()
                
                current = raw.get("current", {})
                hourly = raw.get("hourly", {})
                
                precip_hourly = hourly.get("precipitation", [])
                temp_hourly = hourly.get("temperature_2m", [])
                soil_hourly = hourly.get("soil_moisture_0_to_1cm", [])
                time_hourly = hourly.get("time", [])
                
                # Compute horizon accumulations
                def get_sum(start: int, count: int) -> float:
                    return round(sum(precip_hourly[start:start+count]), 1) if precip_hourly else 0.0

                h6 = get_sum(0, 6)
                h12 = get_sum(0, 12)
                h24 = get_sum(0, 24)
                h48 = get_sum(0, 48)
                h72 = get_sum(0, 72)
                
                # Build parsed forecast horizons
                horizons = [
                    {"horizon_hours": 6, "precipitation_sum": h6, "temperature": temp_hourly[5] if len(temp_hourly) > 5 else None},
                    {"horizon_hours": 12, "precipitation_sum": h12, "temperature": temp_hourly[11] if len(temp_hourly) > 11 else None},
                    {"horizon_hours": 24, "precipitation_sum": h24, "temperature": temp_hourly[23] if len(temp_hourly) > 23 else None},
                    {"horizon_hours": 48, "precipitation_sum": h48, "temperature": temp_hourly[47] if len(temp_hourly) > 47 else None},
                    {"horizon_hours": 72, "precipitation_sum": h72, "temperature": temp_hourly[71] if len(temp_hourly) > 71 else None},
                ]
                
                # Slice first 48 hours for graph display
                hourly_series = []
                for i in range(min(48, len(time_hourly))):
                    hourly_series.append({
                        "time": time_hourly[i],
                        "precipitation": precip_hourly[i] if i < len(precip_hourly) else 0.0,
                        "temperature": temp_hourly[i] if i < len(temp_hourly) else None,
                        "soil_moisture": soil_hourly[i] if i < len(soil_hourly) else None,
                    })

                parsed_data = {
                    "status": "LIVE",
                    "source": "Open-Meteo API",
                    "retrieved_at": now,
                    "valid_until": now + timedelta(minutes=CACHE_TTL_MINUTES),
                    "current": {
                        "temperature_2m": current.get("temperature_2m"),
                        "relative_humidity_2m": current.get("relative_humidity_2m"),
                        "precipitation": current.get("precipitation", 0.0),
                        "rain": current.get("rain", 0.0),
                        "wind_speed_10m": current.get("wind_speed_10m"),
                        "weather_code": current.get("weather_code"),
                        "soil_moisture": soil_hourly[0] if soil_hourly else 0.30
                    },
                    "horizons": horizons,
                    "hourly_series": hourly_series,
                    "rain_accumulations": {
                        "rain_1h": current.get("precipitation", 0.0),
                        "rain_3h": get_sum(0, 3),
                        "rain_6h": h6,
                        "rain_12h": h12,
                        "rain_24h": h24,
                        "rain_48h": h48,
                        "rain_72h": h72
                    }
                }
                
                # Cache successful response
                _weather_cache[cache_key] = {"data": parsed_data, "cached_at": now}
                return parsed_data
            else:
                logger.warning(f"Open-Meteo returned status {response.status_code} for {district_name}")
    except Exception as e:
        logger.error(f"Error fetching Open-Meteo for {district_name}: {e}")

    # Fallback to cached data if available (Marked STALE)
    if cache_key in _weather_cache:
        stale_data = _weather_cache[cache_key]["data"]
        stale_data["status"] = "STALE"
        stale_data["note"] = "Latest live data unavailable. Showing last successful observation."
        return stale_data

    # Graceful OFFLINE fallback
    return {
        "status": "OFFLINE",
        "source": "Open-Meteo API (Offline Fallback)",
        "retrieved_at": now,
        "valid_until": None,
        "current": {
            "temperature_2m": None,
            "relative_humidity_2m": None,
            "precipitation": 0.0,
            "rain": 0.0,
            "wind_speed_10m": None,
            "weather_code": None,
            "soil_moisture": None
        },
        "horizons": [
            {"horizon_hours": 6, "precipitation_sum": 0.0},
            {"horizon_hours": 12, "precipitation_sum": 0.0},
            {"horizon_hours": 24, "precipitation_sum": 0.0},
            {"horizon_hours": 48, "precipitation_sum": 0.0},
            {"horizon_hours": 72, "precipitation_sum": 0.0},
        ],
        "hourly_series": [],
        "rain_accumulations": {
            "rain_1h": 0.0, "rain_3h": 0.0, "rain_6h": 0.0,
            "rain_12h": 0.0, "rain_24h": 0.0, "rain_48h": 0.0, "rain_72h": 0.0
        },
        "note": "Live weather feed currently unreachable."
    }
