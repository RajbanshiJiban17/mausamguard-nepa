from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import utc_now

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    district_name = Column(String(100), index=True, nullable=False)
    
    # Overall and sub-hazard scores (0.0 to 100.0)
    overall_risk_score = Column(Float, nullable=False, default=0.0)
    overall_risk_level = Column(String(50), nullable=False, default="LOW") # LOW, MODERATE, HIGH, VERY HIGH, CRITICAL
    
    flood_risk_score = Column(Float, nullable=False, default=0.0)
    flood_risk_level = Column(String(50), nullable=False, default="LOW")
    
    landslide_risk_score = Column(Float, nullable=False, default=0.0)
    landslide_risk_level = Column(String(50), nullable=False, default="LOW")
    
    rainfall_risk_score = Column(Float, nullable=False, default=0.0)
    rainfall_risk_level = Column(String(50), nullable=False, default="LOW")
    
    agriculture_risk_score = Column(Float, nullable=False, default=0.0)
    agriculture_risk_level = Column(String(50), nullable=False, default="LOW")
    
    # Explainable outputs
    risk_factors = Column(JSON, nullable=False) # list of bullet strings: ["24h rainfall elevated", ...]
    explanation = Column(Text, nullable=False)
    confidence = Column(String(50), default="MEDIUM") # HIGH, MEDIUM, LOW
    
    # Auditability & Versioning
    risk_engine_version = Column(String(50), default="1.0.0")
    inputs_snapshot = Column(JSON, nullable=True) # snapshot of rain, forecast, terrain features used
    sources_used = Column(JSON, nullable=True) # ["Open-Meteo", "NASA GPM", "DHM", "SRTM Terrain"]
    
    calculated_at = Column(DateTime, default=utc_now, index=True)
    valid_until = Column(DateTime, nullable=True)

    district_rel = relationship("District", back_populates="risk_assessments")
    factors_rel = relationship("RiskFactor", back_populates="assessment_rel", cascade="all, delete-orphan")

class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("risk_assessments.id", ondelete="CASCADE"), nullable=False)
    hazard_type = Column(String(50), nullable=False) # flood, landslide, rainfall, agriculture
    factor_name = Column(String(100), nullable=False)
    factor_weight = Column(Float, default=1.0)
    description = Column(String(255), nullable=False)

    assessment_rel = relationship("RiskAssessment", back_populates="factors_rel")

Index("idx_risk_district_calculated", RiskAssessment.district_name, RiskAssessment.calculated_at)
Index("idx_risk_level_calculated", RiskAssessment.overall_risk_level, RiskAssessment.calculated_at)
