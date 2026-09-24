from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import utc_now

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    district_name = Column(String(100), index=True, nullable=False)
    
    temperature_2m = Column(Float, nullable=True) # Celsius
    relative_humidity_2m = Column(Float, nullable=True) # %
    precipitation = Column(Float, default=0.0) # mm
    rain = Column(Float, default=0.0) # mm
    wind_speed_10m = Column(Float, nullable=True) # km/h
    weather_code = Column(Integer, nullable=True) # WMO code
    soil_moisture = Column(Float, nullable=True) # m3/m3
    
    source = Column(String(100), default="Open-Meteo", nullable=False)
    status = Column(String(50), default="LIVE") # LIVE, STALE, OFFLINE
    retrieved_at = Column(DateTime, default=utc_now, index=True)
    valid_until = Column(DateTime, nullable=True)

    district_rel = relationship("District", back_populates="weather_observations")

class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    district_name = Column(String(100), index=True, nullable=False)
    
    forecast_timestamp = Column(DateTime, nullable=False) # Forecast target time
    horizon_hours = Column(Integer, index=True, nullable=False) # 6, 12, 24, 48, 72
    precipitation_sum = Column(Float, default=0.0) # mm accumulation in horizon
    temperature = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    
    hourly_series = Column(JSON, nullable=True) # Array of [{time, precip, temp}]
    source = Column(String(100), default="Open-Meteo")
    retrieved_at = Column(DateTime, default=utc_now)

class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    district_name = Column(String(100), index=True, nullable=False)
    
    rain_1h = Column(Float, default=0.0)
    rain_3h = Column(Float, default=0.0)
    rain_6h = Column(Float, default=0.0)
    rain_12h = Column(Float, default=0.0)
    rain_24h = Column(Float, default=0.0)
    rain_48h = Column(Float, default=0.0)
    rain_72h = Column(Float, default=0.0)
    
    # NASA GPM IMERG fields
    imerg_24h_mm = Column(Float, default=0.0)
    imerg_win_mm = Column(Float, default=0.0)
    imerg_24h_max = Column(Float, default=0.0)
    
    # DHM threshold flags
    exceeds_dhm_1h = Column(Integer, default=0) # 60mm
    exceeds_dhm_3h = Column(Integer, default=0) # 80mm
    exceeds_dhm_6h = Column(Integer, default=0) # 100mm
    exceeds_dhm_12h = Column(Integer, default=0) # 120mm
    exceeds_dhm_24h = Column(Integer, default=0) # 140mm
    
    source = Column(String(100), default="Open-Meteo / NASA GPM IMERG")
    retrieved_at = Column(DateTime, default=utc_now, index=True)

Index("idx_weather_district_retrieved", WeatherObservation.district_name, WeatherObservation.retrieved_at)
Index("idx_forecast_district_horizon", WeatherForecast.district_name, WeatherForecast.horizon_hours)
