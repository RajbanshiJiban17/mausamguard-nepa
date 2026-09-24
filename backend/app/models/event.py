from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import utc_now

class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. bipad-1070
    source = Column(String(100), index=True, nullable=False) # bipad, desinventar, manual
    date = Column(Date, index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    month = Column(Integer, index=True, nullable=True)
    date_precision = Column(String(50), default="day")
    
    hazard_type = Column(String(50), index=True, nullable=False) # flood, landslide, avalanche, flash_flood
    district = Column(String(100), index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True)
    
    municipality = Column(String(150), nullable=True)
    palika_pcode = Column(String(50), nullable=True)
    
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    geo_precision = Column(String(50), default="exact") # exact, palika, district, approximate
    
    severity_score = Column(Float, default=0.0)
    severity_class = Column(String(50), default="moderate") # minor, moderate, severe, catastrophic
    title = Column(String(300), nullable=True)
    
    deaths = Column(Integer, default=0)
    missing = Column(Integer, default=0)
    injured = Column(Integer, default=0)
    people_affected = Column(Integer, default=0)
    houses_destroyed = Column(Integer, default=0)
    houses_damaged = Column(Integer, default=0)
    
    source_url = Column(Text, nullable=True)
    report_sources = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)

    district_rel = relationship("District", back_populates="historical_events")

# Multi-column indexes for query speed
Index("idx_events_district_hazard", HistoricalEvent.district, HistoricalEvent.hazard_type)
Index("idx_events_year_hazard", HistoricalEvent.year, HistoricalEvent.hazard_type)
Index("idx_events_lat_lon", HistoricalEvent.latitude, HistoricalEvent.longitude)
