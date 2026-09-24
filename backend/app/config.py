import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "MausamGuard Nepal"
    PROJECT_SUBTITLE: str = "Real-Time Flood, Landslide & Agriculture Risk Monitoring and Early Warning Decision Support System for Nepal"
    TAGLINE: str = "Monitor. Assess. Warn."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    DEMO_MODE: bool = False
    PRODUCTION_MODE: bool = False
    
    DATABASE_URL: str = "sqlite:///./mausamguard.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    JWT_SECRET: str = "mausamguard_secret_change_in_production_key_nepal_hazard_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    DHM_BASE_URL: str = "https://hydrology.gov.np"
    
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    RATE_LIMIT_DEFAULT: str = "120/minute"
    
    DATA_DIR: str = "data/processed"
    
    # Official DHM Warning Rainfall Thresholds (mm)
    DHM_RAIN_1H_THRESHOLD: float = 60.0
    DHM_RAIN_3H_THRESHOLD: float = 80.0
    DHM_RAIN_6H_THRESHOLD: float = 100.0
    DHM_RAIN_12H_THRESHOLD: float = 120.0
    DHM_RAIN_24H_THRESHOLD: float = 140.0
    
    # Disclaimer text required across APIs
    OFFICIAL_DISCLAIMER: str = (
        "This platform provides risk monitoring and decision-support information using available historical, "
        "observational and forecast data. It is not a replacement for official emergency warnings or government instructions. "
        "Risk estimates contain uncertainty and may be affected by data availability, resolution and model limitations. "
        "For official warnings, follow the relevant authorities such as Nepal's Department of Hydrology and Meteorology (DHM) "
        "and National Disaster Risk Reduction and Management Authority (NDRRMA)."
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
