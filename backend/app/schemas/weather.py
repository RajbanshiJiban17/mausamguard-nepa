from typing import Optional, List, Dict, Any
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict

class WeatherObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_id: int
    district_name: str
    temperature_2m: Optional[float] = None
    relative_humidity_2m: Optional[float] = None
    precipitation: float = 0.0
    rain: float = 0.0
    wind_speed_10m: Optional[float] = None
    weather_code: Optional[int] = None
    soil_moisture: Optional[float] = None
    source: str
    status: str
    retrieved_at: datetime
    valid_until: Optional[datetime] = None

class ForecastHorizonItem(BaseModel):
    horizon_hours: int
    precipitation_sum: float
    temperature: Optional[float] = None
    soil_moisture: Optional[float] = None

class WeatherForecastOut(BaseModel):
    district_name: str
    horizons: List[ForecastHorizonItem]
    hourly_series: Optional[List[Dict[str, Any]]] = None
    source: str
    retrieved_at: datetime

class RainfallDistrictItem(BaseModel):
    district_name: str
    rain_1h: float
    rain_3h: float
    rain_6h: float
    rain_12h: float
    rain_24h: float
    rain_48h: float
    rain_72h: float
    imerg_24h_mm: float
    dhm_warning_triggered: bool
    status: str
    source: str
    retrieved_at: datetime

class RainfallOverview(BaseModel):
    as_of: datetime
    source: str
    highest_24h_district: str
    highest_24h_mm: float
    districts: List[RainfallDistrictItem]
