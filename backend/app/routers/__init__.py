from app.routers.auth import router as auth_router
from app.routers.districts import router as districts_router
from app.routers.events import router as events_router
from app.routers.risk import router as risk_router
from app.routers.rainfall import router as rainfall_router
from app.routers.rivers import router as rivers_router
from app.routers.forecast import router as forecast_router
from app.routers.alerts import router as alerts_router
from app.routers.agriculture import router as agriculture_router
from app.routers.sources import router as sources_router
from app.routers.admin import router as admin_router
from app.routers.health import router as health_router

__all__ = [
    "auth_router",
    "districts_router",
    "events_router",
    "risk_router",
    "rainfall_router",
    "rivers_router",
    "forecast_router",
    "alerts_router",
    "agriculture_router",
    "sources_router",
    "admin_router",
    "health_router"
]
