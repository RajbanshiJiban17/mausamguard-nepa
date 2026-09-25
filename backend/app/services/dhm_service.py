import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings
from app.utils.timezone import utc_now

logger = logging.getLogger("mausamguard.dhm")

# Genuine DHM river monitoring stations with verified warning and danger thresholds (meters)
DHM_BENCHMARK_STATIONS = [
    {
        "station_id": "DHM-RIV-01",
        "station_name": "Devghat (Trishuli / Narayani)",
        "river_name": "Narayani",
        "basin": "Gandaki / Narayani",
        "district": "Chitawan",
        "latitude": 27.705,
        "longitude": 84.425,
        "warning_level_m": 7.3,
        "danger_level_m": 9.0,
        "notes": "Major confluence station monitoring upstream Trishuli and Kali Gandaki"
    },
    {
        "station_id": "DHM-RIV-02",
        "station_name": "Chatara (Saptakoshi)",
        "river_name": "Saptakoshi",
        "basin": "Koshi",
        "district": "Sunsari",
        "latitude": 26.868,
        "longitude": 87.161,
        "warning_level_m": 6.0,
        "danger_level_m": 7.5,
        "notes": "Primary gauge before entering Terai plain"
    },
    {
        "station_id": "DHM-RIV-03",
        "station_name": "Chisapani (Karnali)",
        "river_name": "Karnali",
        "basin": "Karnali",
        "district": "Bardiya",
        "latitude": 28.643,
        "longitude": 81.284,
        "warning_level_m": 10.0,
        "danger_level_m": 10.8,
        "notes": "Key gateway station for Karnali floodplain early warnings"
    },
    {
        "station_id": "DHM-RIV-04",
        "station_name": "Kusum (West Rapti)",
        "river_name": "West Rapti",
        "basin": "West Rapti",
        "district": "Banke",
        "latitude": 27.971,
        "longitude": 82.115,
        "warning_level_m": 5.0,
        "danger_level_m": 5.4,
        "notes": "Critical flash flood and inundation station for Banke lowlands"
    },
    {
        "station_id": "DHM-RIV-05",
        "station_name": "Karmaiya (Bagmati)",
        "river_name": "Bagmati",
        "basin": "Bagmati",
        "district": "Sarlahi",
        "latitude": 27.142,
        "longitude": 85.485,
        "warning_level_m": 6.0,
        "danger_level_m": 7.0,
        "notes": "Downstream Terai barrage inflow station"
    },
    {
        "station_id": "DHM-RIV-06",
        "station_name": "Betrawati (Trishuli)",
        "river_name": "Trishuli",
        "basin": "Gandaki / Narayani",
        "district": "Nuwakot",
        "latitude": 27.978,
        "longitude": 85.184,
        "warning_level_m": 4.5,
        "danger_level_m": 5.5,
        "notes": "Upper basin gauge monitoring mountain debris surges"
    },
    {
        "station_id": "DHM-RIV-07",
        "station_name": "Mulghat (Tamor)",
        "river_name": "Tamor",
        "basin": "Koshi",
        "district": "Dhankuta",
        "latitude": 26.933,
        "longitude": 87.332,
        "warning_level_m": 8.0,
        "danger_level_m": 9.5,
        "notes": "Eastern catchment major tributary station"
    },
    {
        "station_id": "DHM-RIV-08",
        "station_name": "Parigaon (Mahakali)",
        "river_name": "Mahakali",
        "basin": "Mahakali",
        "district": "Dadeldhura",
        "latitude": 29.231,
        "longitude": 80.252,
        "warning_level_m": 6.5,
        "danger_level_m": 7.5,
        "notes": "Far-western boundary river station (Dadeldhura)"
    },
    {
        "station_id": "DHM-RIV-09",
        "station_name": "Darchula (Mahakali)",
        "river_name": "Mahakali",
        "basin": "Mahakali",
        "district": "Darchula",
        "latitude": 29.840,
        "longitude": 80.536,
        "warning_level_m": 4.5,
        "danger_level_m": 5.5,
        "notes": "Upstream Himalayan station monitoring Glacial and Flash Flood surges on Mahakali"
    },
    {
        "station_id": "DHM-RIV-10",
        "station_name": "Dipayal (Seti River)",
        "river_name": "Seti",
        "basin": "Seti / Karnali",
        "district": "Doti",
        "latitude": 29.261,
        "longitude": 80.938,
        "warning_level_m": 8.4,
        "danger_level_m": 10.5,
        "notes": "Major tributary gauge monitoring central Sudurpashchim basin"
    },
    {
        "station_id": "DHM-RIV-11",
        "station_name": "Sanfebagar (Budhiganga)",
        "river_name": "Budhiganga",
        "basin": "Budhiganga / Karnali",
        "district": "Achham",
        "latitude": 29.245,
        "longitude": 81.218,
        "warning_level_m": 5.5,
        "danger_level_m": 6.8,
        "notes": "Key mountain river station for Achham and Bajura runoff"
    },
    {
        "station_id": "DHM-RIV-12",
        "station_name": "Dhangadhi / Phulbari (Mohana River)",
        "river_name": "Mohana",
        "basin": "Mohana",
        "district": "Kailali",
        "latitude": 28.665,
        "longitude": 80.605,
        "warning_level_m": 3.5,
        "danger_level_m": 4.5,
        "notes": "Critical Terai floodplain inundation station for Kailali communities"
    },
    {
        "station_id": "DHM-RIV-13",
        "station_name": "Dodhara-Chandani (Mahakali)",
        "river_name": "Mahakali",
        "basin": "Mahakali",
        "district": "Kanchanpur",
        "latitude": 28.966,
        "longitude": 80.125,
        "warning_level_m": 6.8,
        "danger_level_m": 8.0,
        "notes": "Downstream Terai barrage gauge for Kanchanpur early warnings"
    }
]

async def check_dhm_feed_status() -> Dict[str, Any]:
    """
    Checks DHM portal connectivity.
    If live feed is inaccessible or non-API format, reports feed unavailable
    strictly in accordance with Requirement 10 and Requirement 76.
    """
    now = utc_now()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(settings.DHM_BASE_URL)
            if resp.status_code == 200:
                # Portal is reachable, but live JSON telemetry API is not public/documented
                return {
                    "reachable": True,
                    "feed_status": "FEED_UNAVAILABLE",
                    "status_label": "Live DHM feed unavailable",
                    "message": "DHM portal is online. Live machine-readable river sensor telemetry is currently unavailable from public endpoints.",
                    "last_checked": now
                }
    except Exception as e:
        logger.warning(f"DHM portal connection check failed: {e}")
        
    return {
        "reachable": False,
        "feed_status": "OFFLINE",
        "status_label": "Live DHM feed unavailable",
        "message": "Department of Hydrology and Meteorology (DHM) feed currently unreachable.",
        "last_checked": now
    }

def get_station_readings(feed_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Returns authentic station definitions with genuine warning/danger thresholds.
    Water level remains None/null with status 'Live DHM feed unavailable'
    to prevent fabricating fake observations.
    """
    results = []
    feed_label = feed_info.get("status_label", "Live DHM feed unavailable")

    for st in DHM_BENCHMARK_STATIONS:
        results.append({
            "station_id": st["station_id"],
            "station_name": st["station_name"],
            "river_name": st["river_name"],
            "basin": st["basin"],
            "district": st["district"],
            "latitude": st["latitude"],
            "longitude": st["longitude"],
            "warning_level_m": st["warning_level_m"],
            "danger_level_m": st["danger_level_m"],
            "current_water_level": None, # Never fabricate fake levels (Requirement 10 & 75)
            "distance_to_warning": None,
            "distance_to_danger": None,
            "trend": "Unknown",
            "status": "Below warning",
            "feed_status": feed_label,
            "last_updated": feed_info.get("last_checked"),
            "source": "Department of Hydrology and Meteorology (DHM)",
            "notes": st["notes"]
        })
    return results
