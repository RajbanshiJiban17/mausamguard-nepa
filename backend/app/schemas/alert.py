from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_id: str
    district: str
    district_id: int
    hazard: str
    risk_level: str
    priority: str
    score: float
    message: str
    trigger_factors: List[str]
    source: str
    data_timestamp: datetime
    status: str
    acknowledged: bool
    created_at: datetime
    updated_at: datetime
    expires_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

class AlertResolveRequest(BaseModel):
    resolution_notes: str

class AlertOverview(BaseModel):
    active_count: int
    critical_count: int
    high_warning_count: int
    warning_count: int
    watch_count: int
    info_count: int
    alerts: List[AlertOut]
