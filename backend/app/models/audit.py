from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON, Index
from app.database import Base
from app.utils.timezone import utc_now

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # e.g. "DHM River", "Open-Meteo Weather"
    provider = Column(String(150), nullable=False)
    url = Column(String(255), nullable=True)
    licence = Column(String(100), nullable=False)
    purpose = Column(String(255), nullable=False)
    limitations = Column(Text, nullable=True)
    attribution_text = Column(Text, nullable=False)
    
    status = Column(String(50), default="UNKNOWN") # LIVE, STALE, OFFLINE, UNKNOWN, STATIC
    last_successful_fetch = Column(DateTime, nullable=True)
    last_attempt = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class DataIngestionLog(Base):
    __tablename__ = "data_ingestion_logs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), index=True, nullable=False)
    start_time = Column(DateTime, default=utc_now, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False) # SUCCESS, FAILURE, PARTIAL
    records_processed = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)

class RefreshJob(Base):
    __tablename__ = "refresh_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String(100), unique=True, nullable=False) # weather_job, dhm_job, risk_job, alert_job
    description = Column(String(255), nullable=True)
    schedule = Column(String(100), nullable=False) # e.g. "Hourly", "15 minutes"
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    status = Column(String(50), default="PENDING") # RUNNING, SUCCESS, FAILED, PENDING
    records_updated = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), index=True, nullable=True)
    action = Column(String(100), index=True, nullable=False) # login, logout, failed_login, role_change, user_create, data_refresh, alert_resolve, etc.
    resource = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    status = Column(String(50), default="SUCCESS")
    timestamp = Column(DateTime, default=utc_now, index=True)

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), index=True, nullable=False) # INFO, WARNING, ERROR, CRITICAL
    module = Column(String(100), index=True, nullable=False)
    message = Column(Text, nullable=False)
    request_id = Column(String(100), index=True, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

Index("idx_audit_user_action", AuditLog.username, AuditLog.action)
Index("idx_system_level_time", SystemLog.level, SystemLog.timestamp)
