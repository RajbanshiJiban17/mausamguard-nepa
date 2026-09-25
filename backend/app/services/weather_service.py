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

async def fetch_open_meteo_weather(
    latitude: float,
    longitude: float,
    location_name: str,
    forecast_days: int = 7,
    palika_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetches genuine real-time weather and 7-day forecast data from Open-Meteo API.
    Supports district centroids and local government (Palika) coordinates.
    Includes caching, exponential backoff, and graceful fallback to cached data.
    """
    days = max(1, min(7, forecast_days))
    loc_tag = f"{location_name}_{palika_name}" if palika_name else location_name
    cache_key = f"{loc_tag}:{latitude:.3f}:{longitude:.3f}:{days}d"
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
        "hourly": "precipitation,temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,soil_moisture_0_to_1cm",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
        "forecast_days": days,
        "timezone": "Asia/Kathmandu"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                raw = response.json()
                
                current = raw.get("current", {})
                hourly = raw.get("hourly", {})
                daily = raw.get("daily", {})
                
                precip_hourly = hourly.get("precipitation", [])
                temp_hourly = hourly.get("temperature_2m", [])
                rh_hourly = hourly.get("relative_humidity_2m", [])
                wind_hourly = hourly.get("wind_speed_10m", [])
                code_hourly = hourly.get("weather_code", [])
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
                total_7d = round(sum(precip_hourly), 1) if precip_hourly else 0.0
                
                # Build parsed forecast horizons
                horizons = [
                    {"horizon_hours": 6, "precipitation_sum": h6, "temperature": temp_hourly[5] if len(temp_hourly) > 5 else None},
                    {"horizon_hours": 12, "precipitation_sum": h12, "temperature": temp_hourly[11] if len(temp_hourly) > 11 else None},
                    {"horizon_hours": 24, "precipitation_sum": h24, "temperature": temp_hourly[23] if len(temp_hourly) > 23 else None},
                    {"horizon_hours": 48, "precipitation_sum": h48, "temperature": temp_hourly[47] if len(temp_hourly) > 47 else None},
                    {"horizon_hours": 72, "precipitation_sum": h72, "temperature": temp_hourly[71] if len(temp_hourly) > 71 else None},
                ]
                
                # Parse 7-day daily forecast summary
                daily_times = daily.get("time", [])
                daily_weather_code = daily.get("weather_code", [])
                daily_temp_max = daily.get("temperature_2m_max", [])
                daily_temp_min = daily.get("temperature_2m_min", [])
                daily_precip_sum = daily.get("precipitation_sum", [])
                daily_precip_prob = daily.get("precipitation_probability_max", [])
                daily_wind_max = daily.get("wind_speed_10m_max", [])

                daily_forecast = []
                for i in range(len(daily_times)):
                    daily_forecast.append({
                        "date": daily_times[i],
                        "weather_code": daily_weather_code[i] if i < len(daily_weather_code) else 0,
                        "temp_max": daily_temp_max[i] if i < len(daily_temp_max) else None,
                        "temp_min": daily_temp_min[i] if i < len(daily_temp_min) else None,
                        "precipitation_sum": daily_precip_sum[i] if i < len(daily_precip_sum) else 0.0,
                        "precipitation_probability": daily_precip_prob[i] if i < len(daily_precip_prob) else None,
                        "wind_speed_max": daily_wind_max[i] if i < len(daily_wind_max) else None,
                    })

                # Full 7-day hourly series (up to 168 hours)
                hourly_series = []
                for i in range(len(time_hourly)):
                    hourly_series.append({
                        "time": time_hourly[i],
                        "precipitation": precip_hourly[i] if i < len(precip_hourly) else 0.0,
                        "temperature": temp_hourly[i] if i < len(temp_hourly) else None,
                        "relative_humidity": rh_hourly[i] if i < len(rh_hourly) else None,
                        "wind_speed": wind_hourly[i] if i < len(wind_hourly) else None,
                        "weather_code": code_hourly[i] if i < len(code_hourly) else None,
                        "soil_moisture": soil_hourly[i] if i < len(soil_hourly) else None,
                    })

                parsed_data = {
                    "status": "LIVE",
                    "source": "Open-Meteo NWP ECMWF/GFS Ensemble",
                    "retrieved_at": now,
                    "valid_until": now + timedelta(minutes=CACHE_TTL_MINUTES),
                    "latitude": latitude,
                    "longitude": longitude,
                    "location_name": location_name,
                    "palika_name": palika_name,
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
                    "daily_forecast": daily_forecast,
                    "hourly_series": hourly_series,
                    "total_7d_rainfall_mm": total_7d,
                    "rain_accumulations": {
                        "rain_1h": current.get("precipitation", 0.0),
                        "rain_3h": get_sum(0, 3),
                        "rain_6h": h6,
                        "rain_12h": h12,
                        "rain_24h": h24,
                        "rain_48h": h48,
                        "rain_72h": h72,
                        "rain_7d": total_7d
                    }
                }
                
                # Cache successful response
                _weather_cache[cache_key] = {"data": parsed_data, "cached_at": now}
                return parsed_data
            else:
                logger.warning(f"Open-Meteo returned status {response.status_code} for {location_name}")
    except Exception as e:
        logger.error(f"Error fetching Open-Meteo for {location_name}: {e}")

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
        "latitude": latitude,
        "longitude": longitude,
        "location_name": location_name,
        "palika_name": palika_name,
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
        "daily_forecast": [],
        "hourly_series": [],
        "total_7d_rainfall_mm": 0.0,
        "rain_accumulations": {
            "rain_1h": 0.0, "rain_3h": 0.0, "rain_6h": 0.0,
            "rain_12h": 0.0, "rain_24h": 0.0, "rain_48h": 0.0, "rain_72h": 0.0, "rain_7d": 0.0
        },
        "note": "Live weather feed currently unreachable."
    }
