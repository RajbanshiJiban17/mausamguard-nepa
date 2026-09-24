from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, JSON, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import utc_now

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. ALT-20260924-KATHMANDU-01
    fingerprint = Column(String(255), index=True, nullable=False) # district+hazard+risk_level+trigger_type
    
    district = Column(String(100), index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    
    hazard = Column(String(50), index=True, nullable=False) # flood, landslide, heavy_rainfall, agriculture
    risk_level = Column(String(50), index=True, nullable=False) # LOW, MODERATE, HIGH, VERY HIGH, CRITICAL
    priority = Column(String(50), index=True, nullable=False)   # INFO, WATCH, WARNING, HIGH WARNING, CRITICAL
    score = Column(Float, default=0.0)
    
    message = Column(Text, nullable=False)
    trigger_factors = Column(JSON, nullable=False)
    source = Column(String(100), default="MausamGuard Early Warning Engine")
    data_timestamp = Column(DateTime, default=utc_now)
    
    status = Column(String(50), default="ACTIVE", index=True) # ACTIVE, EXPIRED, RESOLVED
    acknowledged = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    expires_at = Column(DateTime, nullable=False)
    
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    district_rel = relationship("District", back_populates="alerts")

class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    district = Column(String(100), nullable=False)
    hazard = Column(String(50), nullable=True) # None = all hazards
    min_priority = Column(String(50), default="WARNING") # INFO, WATCH, WARNING, HIGH WARNING, CRITICAL
    created_at = Column(DateTime, default=utc_now)

Index("idx_alerts_status_priority", Alert.status, Alert.priority)
Index("idx_alerts_district_hazard", Alert.district, Alert.hazard)
