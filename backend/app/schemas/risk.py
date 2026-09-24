from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RiskFactorOut(BaseModel):
    hazard_type: str
    factor_name: str
    description: str

class RiskAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_id: int
    district_name: str
    overall_risk_score: float
    overall_risk_level: str
    flood_risk_score: float
    flood_risk_level: str
    landslide_risk_score: float
    landslide_risk_level: str
    rainfall_risk_score: float
    rainfall_risk_level: str
    agriculture_risk_score: float
    agriculture_risk_level: str
    risk_factors: List[str]
    explanation: str
    confidence: str
    risk_engine_version: str
    sources_used: Optional[List[str]] = None
    calculated_at: datetime
    valid_until: Optional[datetime] = None

class DistrictRiskMatrixItem(BaseModel):
    district_id: int
    district_name: str
    province: str
    overall_risk: str
    overall_score: float
    flood_risk: str
    landslide_risk: str
    rainfall_risk: str
    agriculture_risk: str
    top_factor: str
    confidence: str
    active_alerts: int
    calculated_at: datetime

class NationalRiskOverview(BaseModel):
    generated_at: datetime
    total_districts: int
    critical_districts_count: int
    very_high_districts_count: int
    high_districts_count: int
    moderate_districts_count: int
    low_districts_count: int
    flood_high_plus_count: int
    landslide_high_plus_count: int
    agriculture_high_plus_count: int
    districts: List[DistrictRiskMatrixItem]
