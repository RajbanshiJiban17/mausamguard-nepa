from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DataSourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    provider: str
    url: Optional[str] = None
    licence: str
    purpose: str
    limitations: Optional[str] = None
    attribution_text: str
    status: str
    last_successful_fetch: Optional[datetime] = None
    last_attempt: Optional[datetime] = None
    error_message: Optional[str] = None

class IngestionLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str
    records_processed: int
    duration_seconds: float
    error_message: Optional[str] = None

class RefreshJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_name: str
    description: Optional[str] = None
    schedule: str
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    status: str
    records_updated: int
    duration_seconds: float
    error_message: Optional[str] = None

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    status: str
    timestamp: datetime

class DataQualityReport(BaseModel):
    dataset_name: str
    generated_at: datetime
    total_records: int
    valid_records: int
    invalid_records: int
    missing_coordinates: int
    invalid_dates: int
    duplicate_events: int
    impossible_negatives: int
    districts_covered: int
    expected_districts: int
    missing_districts: List[str]
    hazards_distribution: Dict[str, int]
    source_coverage: Dict[str, int]
    date_range: Dict[str, str]
    overall_status: str
