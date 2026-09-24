from typing import Optional, Dict, Any, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class HistoricalEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: str
    source: str
    date: date
    year: int
    month: Optional[int] = None
    date_precision: Optional[str] = "day"
    hazard_type: str
    district: str
    municipality: Optional[str] = None
    palika_pcode: Optional[str] = None
    latitude: float
    longitude: float
    geo_precision: str
    severity_score: float
    severity_class: str
    title: Optional[str] = None
    deaths: int
    missing: int
    injured: int
    people_affected: int
    houses_destroyed: int
    houses_damaged: int
    source_url: Optional[str] = None
    report_sources: Optional[str] = None
    notes: Optional[str] = None

class EventFilterParams(BaseModel):
    hazard_type: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    source: Optional[str] = None
    min_deaths: Optional[int] = None
    severity_class: Optional[str] = None

class EventStatsSummary(BaseModel):
    total_events: int
    total_deaths: int
    total_missing: int
    total_injured: int
    total_houses_destroyed: int
    total_people_affected: int
    by_hazard: Dict[str, int]
    by_source: Dict[str, int]
    by_province: Dict[str, int]
    date_range: Dict[str, str]

class YearlyTrendItem(BaseModel):
    year: int
    event_count: int
    deaths: int
    missing: int
    injured: int
    flood_count: int
    landslide_count: int
    avalanche_count: int

class MonthlyTrendItem(BaseModel):
    month: int
    month_name: str
    event_count: int
    avg_events: float
    deaths: int
