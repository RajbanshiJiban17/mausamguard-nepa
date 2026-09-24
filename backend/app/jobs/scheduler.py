import logging
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.database import SessionLocal
from app.utils.timezone import utc_now
from app.models.audit import RefreshJob
from app.models.district import District
from app.services.weather_service import fetch_open_meteo_weather
from app.services.dhm_service import check_dhm_feed_status
from app.risk_engine.calculator import calculate_district_risk
from app.services.alert_service import evaluate_and_create_alerts

logger = logging.getLogger("mausamguard.scheduler")
scheduler = AsyncIOScheduler()

async def run_weather_refresh_job():
    """Fetches real-time weather observations for districts and caches them."""
    start_time = utc_now()
    logger.info("Executing scheduled weather refresh job...")
    db = SessionLocal()
    try:
        districts = db.query(District).limit(10).all() # Refresh in rotating batches to stay polite with APIs
        updated = 0
        for d in districts:
            await fetch_open_meteo_weather(d.latitude, d.longitude, d.district_name)
            updated += 1
            await asyncio.sleep(0.5)

        duration = (utc_now() - start_time).total_seconds()
        
        # Log job status
        job = db.query(RefreshJob).filter(RefreshJob.job_name == "weather_job").first()
        if not job:
            job = RefreshJob(job_name="weather_job", schedule="Every 30 minutes")
            db.add(job)
        job.last_run = start_time
        job.status = "SUCCESS"
        job.records_updated = updated
        job.duration_seconds = duration
        job.error_message = None
        db.commit()
    except Exception as e:
        logger.error(f"Weather refresh job failed: {e}")
        db.rollback()
    finally:
        db.close()

async def run_dhm_refresh_job():
    """Checks DHM portal status."""
    start_time = utc_now()
    db = SessionLocal()
    try:
        status_info = await check_dhm_feed_status()
        duration = (utc_now() - start_time).total_seconds()
        
        job = db.query(RefreshJob).filter(RefreshJob.job_name == "dhm_job").first()
        if not job:
            job = RefreshJob(job_name="dhm_job", schedule="Every 15 minutes")
            db.add(job)
        job.last_run = start_time
        job.status = "SUCCESS" if status_info["reachable"] else "FAILED"
        job.records_updated = 1
        job.duration_seconds = duration
        job.error_message = None if status_info["reachable"] else "DHM Feed unreachable"
        db.commit()
    except Exception as e:
        logger.error(f"DHM refresh job failed: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    """Starts background scheduled tasks."""
    try:
        # Schedule jobs
        scheduler.add_job(
            run_weather_refresh_job,
            trigger=IntervalTrigger(minutes=30),
            id="weather_job",
            name="Open-Meteo Weather Refresh",
            replace_existing=True
        )
        scheduler.add_job(
            run_dhm_refresh_job,
            trigger=IntervalTrigger(minutes=15),
            id="dhm_job",
            name="DHM Hydrology Status Check",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started successfully for MausamGuard Nepal background jobs.")
    except Exception as e:
        logger.error(f"Failed to start APScheduler: {e}")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")
