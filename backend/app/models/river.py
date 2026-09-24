from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from app.database import Base
from app.utils.timezone import utc_now

class RiverStation(Base):
    __tablename__ = "river_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. DHM-RIV-01
    station_name = Column(String(150), index=True, nullable=False)
    river_name = Column(String(100), nullable=False)
    basin = Column(String(100), index=True, nullable=False) # Koshi, Narayani, Gandaki, Karnali, Mahakali, West Rapti, Bagmati
    district = Column(String(100), index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)
    
    warning_level_m = Column(Float, nullable=False) # e.g. 5.5
    danger_level_m = Column(Float, nullable=False)  # e.g. 6.8
    
    # Live / Last observation state
    current_water_level = Column(Float, nullable=True)
    trend = Column(String(50), default="Steady") # Rising, Falling, Steady
    status = Column(String(50), default="Below warning") # Below warning, Above warning, Above danger, Feed Unavailable
    feed_status = Column(String(50), default="LIVE") # LIVE, STALE, OFFLINE, FEED_UNAVAILABLE
    last_updated = Column(DateTime, nullable=True)
    source = Column(String(100), default="Department of Hydrology and Meteorology (DHM)")
    notes = Column(String(255), nullable=True)

class RiverObservation(Base):
    __tablename__ = "river_observations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), ForeignKey("river_stations.station_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)
    water_level = Column(Float, nullable=True)
    trend = Column(String(50), default="Steady")
    status = Column(String(50), default="Below warning")
    source = Column(String(100), default="DHM Nepal")
