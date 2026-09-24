from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Index
from app.database import Base
from app.utils.timezone import utc_now

class AgricultureRisk(Base):
    __tablename__ = "agriculture_risk"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    district_name = Column(String(100), index=True, nullable=False)
    
    crop_risk_level = Column(String(50), nullable=False, default="LOW") # LOW, MODERATE, HIGH, VERY HIGH
    risk_score = Column(Float, default=0.0)
    
    # Specific stressors
    rainfall_stress_level = Column(String(50), default="NORMAL") # DEFICIT, NORMAL, EXCESS, SEVERE_EXCESS
    temperature_stress_level = Column(String(50), default="NORMAL") # COLD_STRESS, OPTIMAL, HEAT_STRESS
    flood_exposure_level = Column(String(50), default="LOW")
    landslide_exposure_level = Column(String(50), default="LOW")
    soil_moisture_condition = Column(String(50), default="OPTIMAL") # DRY, MOIST, SATURATED, WATERLOGGED
    
    # Quantitative readings
    recent_rainfall_mm = Column(Float, default=0.0)
    forecast_rainfall_mm = Column(Float, default=0.0)
    avg_temperature_c = Column(Float, nullable=True)
    soil_moisture_val = Column(Float, nullable=True)
    
    # Recommendations & Guidance
    guidance_label = Column(String(100), default="General agriculture risk guidance")
    suggested_actions = Column(JSON, nullable=False) # list of action bullets
    risk_summary = Column(Text, nullable=False)
    
    # Extensible future crop attributes
    crop_type = Column(String(100), nullable=True) # e.g. Paddy, Maize, Wheat, Millet, Vegetables
    crop_stage = Column(String(100), nullable=True) # Seedling, Vegetative, Flowering, Maturity
    soil_type = Column(String(100), nullable=True)
    
    calculated_at = Column(DateTime, default=utc_now, index=True)
    valid_until = Column(DateTime, nullable=True)

Index("idx_agri_district_calc", AgricultureRisk.district_name, AgricultureRisk.calculated_at)
