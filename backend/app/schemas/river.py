from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RiverStationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    station_id: str
    station_name: str
    river_name: str
    basin: str
    district: str
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    warning_level_m: float
    danger_level_m: float
    current_water_level: Optional[float] = None
    trend: str
    status: str
    feed_status: str
    distance_to_warning: Optional[float] = None
    distance_to_danger: Optional[float] = None
    last_updated: Optional[datetime] = None
    source: str
    notes: Optional[str] = None

class RiverOverview(BaseModel):
    total_stations: int
    stations_above_danger: int
    stations_above_warning: int
    feed_status_summary: str
    stations: list[RiverStationOut]
