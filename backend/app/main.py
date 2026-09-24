import logging
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.ingestion.data_loader import load_all_data_if_needed
from app.jobs.scheduler import start_scheduler, stop_scheduler
from app.security.middleware import SecurityHeadersMiddleware
from app.routers import (
    auth_router,
    districts_router,
    events_router,
    risk_router,
    rainfall_router,
    rivers_router,
    forecast_router,
    alerts_router,
    agriculture_router,
    sources_router,
    admin_router,
    health_router
)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mausamguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    try:
        # 1. Initialize database schema
        init_db()
        
        # 2. Check and load initial verified datasets
        load_all_data_if_needed()
        
        # 3. Start background ingestion scheduler
        start_scheduler()
    except Exception as e:
        logger.error(f"Critical error during startup: {e}", exc_info=True)
        # Note: per Requirement 77, fail safely
    
    yield
    
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        f"{settings.PROJECT_SUBTITLE}\n\n"
        f"**Official Disclaimer**: {settings.OFFICIAL_DISCLAIMER}"
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list if settings.PRODUCTION_MODE else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Friendly Global Error Handlers (Requirement 29 & 77)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "request_id": request_id
            },
            "disclaimer": settings.OFFICIAL_DISCLAIMER
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(f"Unhandled exception on {request.url} (Request ID: {request_id}): {exc}", exc_info=True)
    
    # In production, never expose internal tracebacks
    message = "An unexpected internal server error occurred. Please contact system support."
    if settings.DEBUG:
        message = str(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": message,
                "request_id": request_id
            },
            "disclaimer": settings.OFFICIAL_DISCLAIMER
        }
    )

# 4. Mount Routers
api_v1 = settings.API_V1_STR
app.include_router(health_router)
app.include_router(auth_router, prefix=api_v1)
app.include_router(districts_router, prefix=api_v1)
app.include_router(events_router, prefix=api_v1)
app.include_router(risk_router, prefix=api_v1)
app.include_router(rainfall_router, prefix=api_v1)
app.include_router(rivers_router, prefix=api_v1)
app.include_router(forecast_router, prefix=api_v1)
app.include_router(alerts_router, prefix=api_v1)
app.include_router(agriculture_router, prefix=api_v1)
app.include_router(sources_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)
