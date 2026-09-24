from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AgricultureRiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_id: int
    district_name: str
    crop_risk_level: str
    risk_score: float
    rainfall_stress_level: str
    temperature_stress_level: str
    flood_exposure_level: str
    landslide_exposure_level: str
    soil_moisture_condition: str
    recent_rainfall_mm: float
    forecast_rainfall_mm: float
    avg_temperature_c: Optional[float] = None
    soil_moisture_val: Optional[float] = None
    guidance_label: str
    suggested_actions: List[str]
    risk_summary: str
    calculated_at: datetime
    valid_until: Optional[datetime] = None

class AgricultureOverview(BaseModel):
    national_crop_risk_summary: str
    high_risk_districts_count: int
    waterlogged_districts_count: int
    drought_or_deficit_districts_count: int
    general_guidance: List[str]
    districts: List[AgricultureRiskOut]
