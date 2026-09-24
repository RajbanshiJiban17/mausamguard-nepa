from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MunicipalityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pcode: str
    palika_name: str
    district_name: str
    area_sqkm: Optional[float] = None
    total_events: int
    total_deaths: int
    total_missing: int
    total_injured: int
    people_affected: int
    hazard_breakdown: Optional[Dict[str, int]] = None

class DistrictSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_name: str
    pcode: Optional[str] = None
    province: str
    latitude: float
    longitude: float
    area_sqkm: Optional[float] = None
    population: Optional[int] = None
    total_events: int
    total_deaths: int
    total_missing: int
    total_injured: int
    houses_destroyed: int
    people_affected: int
    deaths_per_100k: float
    hazard_breakdown: Optional[Dict[str, int]] = None
    
    current_overall_risk: Optional[str] = "LOW"
    current_risk_score: Optional[float] = 0.0
    current_flood_risk: Optional[str] = "LOW"
    current_landslide_risk: Optional[str] = "LOW"
    current_agriculture_risk: Optional[str] = "LOW"
    active_alert_count: Optional[int] = 0
    latest_rainfall_mm: Optional[float] = 0.0

class DistrictDetail(DistrictSummary):
    decade_breakdown: Optional[Dict[str, int]] = None
    worst_event: Optional[Dict[str, Any]] = None
    geometry: Optional[Dict[str, Any]] = None
    municipalities: List[MunicipalityOut] = []
    recent_events: List[Dict[str, Any]] = []
    active_alerts: List[Dict[str, Any]] = []
    latest_weather: Optional[Dict[str, Any]] = None
    forecast_summary: Optional[Dict[str, Any]] = None
    nearest_river_station: Optional[Dict[str, Any]] = None
    risk_factors: Optional[List[str]] = None
    risk_explanation: Optional[str] = None
    last_updated: Optional[datetime] = None

class DistrictComparison(BaseModel):
    districts: List[DistrictDetail]
