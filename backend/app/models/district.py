from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import utc_now

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    district_name = Column(String(100), unique=True, index=True, nullable=False)
    pcode = Column(String(50), index=True, nullable=True) # e.g. NP0101
    province = Column(String(100), index=True, nullable=False) # e.g. Koshi, Bagmati, Gandaki, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_sqkm = Column(Float, nullable=True)
    population = Column(Integer, nullable=True)
    
    # Historical stats from district_index.json
    total_events = Column(Integer, default=0)
    total_deaths = Column(Integer, default=0)
    total_missing = Column(Integer, default=0)
    total_injured = Column(Integer, default=0)
    houses_destroyed = Column(Integer, default=0)
    people_affected = Column(Integer, default=0)
    deaths_per_100k = Column(Float, default=0.0)
    hazard_breakdown = Column(JSON, nullable=True) # {"landslide": x, "flood": y, ...}
    decade_breakdown = Column(JSON, nullable=True)
    worst_event = Column(JSON, nullable=True)
    
    # Boundary GeoJSON (feature geometry stored as JSON)
    geometry = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    municipalities = relationship("Municipality", back_populates="district_rel", cascade="all, delete-orphan")
    historical_events = relationship("HistoricalEvent", back_populates="district_rel")
    weather_observations = relationship("WeatherObservation", back_populates="district_rel")
    risk_assessments = relationship("RiskAssessment", back_populates="district_rel")
    alerts = relationship("Alert", back_populates="district_rel")

class Municipality(Base):
    __tablename__ = "municipalities"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=True)
    district_name = Column(String(100), index=True, nullable=False)
    pcode = Column(String(50), unique=True, index=True, nullable=False) # NP0101301
    palika_name = Column(String(150), index=True, nullable=False)
    area_sqkm = Column(Float, nullable=True)
    
    total_events = Column(Integer, default=0)
    total_deaths = Column(Integer, default=0)
    total_missing = Column(Integer, default=0)
    total_injured = Column(Integer, default=0)
    houses_destroyed = Column(Integer, default=0)
    people_affected = Column(Integer, default=0)
    hazard_breakdown = Column(JSON, nullable=True)
    worst_event = Column(JSON, nullable=True)

    district_rel = relationship("District", back_populates="municipalities")
