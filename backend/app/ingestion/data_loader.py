import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models.user import User, Role
from app.models.district import District, Municipality
from app.models.event import HistoricalEvent
from app.models.river import RiverStation
from app.models.audit import DataSource
from app.models.risk import RiskAssessment
from app.models.agriculture import AgricultureRisk
from app.services.dhm_service import DHM_BENCHMARK_STATIONS
from app.risk_engine.calculator import calculate_district_risk
from app.services.alert_service import evaluate_and_create_alerts
from app.security.auth import get_password_hash
from app.utils.timezone import utc_now

logger = logging.getLogger("mausamguard.ingestion")

def load_all_data_if_needed(db: Session = None):
    """
    Validates dataset files, seeds initial database tables,
    loads all 77 districts, municipalities, and 13,185 historical events.
    """
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Check if already seeded
        district_count = db.query(District).count()
        if district_count >= 77:
            logger.info(f"Database already contains {district_count} districts. Checking events...")
            event_count = db.query(HistoricalEvent).count()
            if event_count > 0:
                logger.info(f"Database already contains {event_count} historical events. Ingestion complete.")
                return

        logger.info("Initializing MausamGuard Nepal database with verified datasets...")

        # 1. Seed Roles & Default Admin
        seed_roles_and_admin(db)

        # 2. Seed Data Sources attribution
        seed_data_sources(db)

        # 3. Seed River Stations
        seed_river_stations(db)

        # 4. Load Districts
        load_districts_and_palikas(db)

        # 5. Load Historical Events
        load_historical_events(db)

        # 6. Run Initial Risk Calculations
        run_initial_risk_assessments(db)

        logger.info("Data ingestion completed successfully!")

    except Exception as e:
        logger.error(f"Error during data loading: {e}", exc_info=True)
        db.rollback()
        raise e
    finally:
        if close_session:
            db.close()

def seed_roles_and_admin(db: Session):
    roles = ["ADMIN", "ANALYST", "OPERATOR", "VIEWER"]
    role_objs = {}
    for r in roles:
        role = db.query(Role).filter(Role.name == r).first()
        if not role:
            role = Role(name=r, description=f"{r.capitalize()} role with designated access")
            db.add(role)
            db.commit()
            db.refresh(role)
        role_objs[r] = role

    # Create default admin if not exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            email="admin@mausamguard.gov.np",
            username="admin",
            full_name="MausamGuard System Administrator",
            hashed_password=get_password_hash("MausamGuardAdmin2026!"),
            is_active=True,
            is_superuser=True,
            created_at=utc_now()
        )
        admin_user.roles.append(role_objs["ADMIN"])
        db.add(admin_user)
        db.commit()
        logger.info("Created default system administrator user (admin / MausamGuardAdmin2026!).")

def seed_data_sources(db: Session):
    sources = [
        {
            "name": "Nepal Hazard Explorer / BIPAD & DesInventar",
            "provider": "Nepal Water & Slope Hazard Explorer / BIPAD Portal / DesInventar Sentinel",
            "url": "https://bipadportal.gov.np",
            "licence": "Varies by source; ICIMOD datasets CC BY 4.0; DesInventar / BIPAD government open data",
            "purpose": "Historical multi-hazard disaster inventory (1971-2026) for baseline hazard exposure modeling.",
            "limitations": "Event reporting density increased post-2011; localized village events may have district centroid coordinates.",
            "attribution_text": "Historical hazard-event data compiled from BIPAD/Nepal DRR Portal, DesInventar Sentinel and documented disaster reports.",
            "status": "STATIC"
        },
        {
            "name": "Department of Hydrology and Meteorology (DHM) Nepal",
            "provider": "Ministry of Energy, Water Resources and Irrigation, Government of Nepal",
            "url": "https://hydrology.gov.np",
            "licence": "Government of Nepal Open Data / Public Monitoring",
            "purpose": "Official reference warning thresholds for rainfall (60mm/1h, 80mm/3h, 100mm/6h, 120mm/12h, 140mm/24h) and river telemetry.",
            "limitations": "Live telemetry requires dedicated departmental network gateways.",
            "attribution_text": "Department of Hydrology and Meteorology (DHM), Government of Nepal.",
            "status": "LIVE"
        },
        {
            "name": "Open-Meteo Weather API",
            "provider": "Open-Meteo GmbH",
            "url": "https://open-meteo.com",
            "licence": "Non-commercial CC BY 4.0 / Open-Meteo Terms",
            "purpose": "Real-time weather observation, precipitation, temperature, relative humidity, wind speed, and 72-hour forecast.",
            "limitations": "Grid resolution ~11km; mountain localized microclimates may vary from synoptic numerical weather models.",
            "attribution_text": "Weather forecast data provided by Open-Meteo API (CC BY 4.0).",
            "status": "LIVE"
        },
        {
            "name": "NASA GPM IMERG Late Precipitation",
            "provider": "NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)",
            "url": "https://gpm.nasa.gov",
            "licence": "NASA Open Data Policy",
            "purpose": "Satellite rainfall accumulation monitoring across remote Himalayan catchments.",
            "limitations": "Satellite retrieval latency ~14-16 hours; heavy localized convective clouds may produce calibration offsets.",
            "attribution_text": "NASA Global Precipitation Measurement (GPM) Integrated Multi-satellitE Retrievals for GPM (IMERG).",
            "status": "STATIC"
        },
        {
            "name": "OCHA / HDX Administrative Boundaries",
            "provider": "UN OCHA / Survey Department of Nepal",
            "url": "https://data.humdata.org/dataset/cod-ab-npl",
            "licence": "Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO)",
            "purpose": "77 District and 753 Local Level (Palika) administrative boundaries.",
            "limitations": "Boundaries represent official administrative delineations as adopted in Federal Nepal.",
            "attribution_text": "Survey Department of Nepal / UN OCHA Humanitarian Data Exchange (HDX).",
            "status": "STATIC"
        }
    ]

    for s in sources:
        existing = db.query(DataSource).filter(DataSource.name == s["name"]).first()
        if not existing:
            ds = DataSource(**s, last_successful_fetch=utc_now(), last_attempt=utc_now())
            db.add(ds)
    db.commit()

def seed_river_stations(db: Session):
    for st in DHM_BENCHMARK_STATIONS:
        existing = db.query(RiverStation).filter(RiverStation.station_id == st["station_id"]).first()
        if not existing:
            r_station = RiverStation(
                station_id=st["station_id"],
                station_name=st["station_name"],
                river_name=st["river_name"],
                basin=st["basin"],
                district=st["district"],
                latitude=st["latitude"],
                longitude=st["longitude"],
                warning_level_m=st["warning_level_m"],
                danger_level_m=st["danger_level_m"],
                status="Below warning",
                feed_status="LIVE",
                last_updated=utc_now(),
                notes=st["notes"]
            )
            db.add(r_station)
    db.commit()

def load_districts_and_palikas(db: Session):
    data_dir = os.path.join(os.getcwd(), "data", "processed")
    boundary_path = os.path.join(data_dir, "districts_boundary.geojson")
    districts_geojson_path = os.path.join(data_dir, "districts.geojson")
    district_index_path = os.path.join(data_dir, "district_index.json")
    palika_index_path = os.path.join(data_dir, "palika_index.json")

    if not os.path.exists(district_index_path) or not os.path.exists(boundary_path):
        raise FileNotFoundError(f"Required district files missing in {data_dir}")

    with open(district_index_path, "r", encoding="utf-8") as f:
        di_data = json.load(f)

    with open(boundary_path, "r", encoding="utf-8") as f:
        db_data = json.load(f)

    with open(districts_geojson_path, "r", encoding="utf-8") as f:
        dg_data = json.load(f)

    # Map province and pcode from districts_boundary
    prov_map = {}
    pcode_map = {}
    area_map = {}
    for feat in db_data.get("features", []):
        props = feat.get("properties", {})
        dname = props.get("adm2_name")
        if dname:
            prov_name = props.get("adm1_name", "Unknown")
            if "sudur" in prov_name.lower():
                prov_name = "Sudurpashchim"
            prov_map[dname] = prov_name
            pcode_map[dname] = props.get("adm2_pcode", "")
            area_map[dname] = props.get("area_sqkm", 0.0)

    # Map geometries and coordinates from districts.geojson
    geom_map = {}
    coord_map = {}
    for feat in dg_data.get("features", []):
        props = feat.get("properties", {})
        dname = props.get("district")
        geom = feat.get("geometry", {})
        if dname and geom:
            geom_map[dname] = geom
            # Compute centroid from coordinates
            try:
                coords = geom.get("coordinates", [])
                all_pts = []
                def extract_pts(c):
                    if isinstance(c[0], (int, float)):
                        all_pts.append(c)
                    else:
                        for sub in c:
                            extract_pts(sub)
                extract_pts(coords)
                if all_pts:
                    avg_lon = sum(p[0] for p in all_pts) / len(all_pts)
                    avg_lat = sum(p[1] for p in all_pts) / len(all_pts)
                    coord_map[dname] = (avg_lat, avg_lon)
            except Exception:
                coord_map[dname] = (28.0, 84.0)

    # Insert all 77 districts
    district_objs = {}
    for dname, info in di_data.items():
        existing = db.query(District).filter(District.district_name == dname).first()
        lat, lon = coord_map.get(dname, (28.0, 84.0))
        
        if not existing:
            d_obj = District(
                district_name=dname,
                pcode=pcode_map.get(dname, ""),
                province=prov_map.get(dname, "Bagmati"),
                latitude=lat,
                longitude=lon,
                area_sqkm=area_map.get(dname, 0.0),
                population=info.get("population", 0),
                total_events=info.get("events", 0),
                total_deaths=info.get("deaths", 0),
                total_missing=info.get("missing", 0),
                total_injured=info.get("injured", 0),
                houses_destroyed=info.get("houses_destroyed", 0),
                people_affected=info.get("people_affected", 0),
                deaths_per_100k=info.get("deaths_per_100k", 0.0),
                hazard_breakdown=info.get("by_hazard", {}),
                decade_breakdown=info.get("by_decade", {}),
                worst_event=info.get("worst", {}),
                geometry=geom_map.get(dname)
            )
            db.add(d_obj)
            district_objs[dname] = d_obj
        else:
            district_objs[dname] = existing

    db.commit()
    logger.info(f"Loaded {len(di_data)} districts into database.")

    # Load Palikas if palika_index.json exists
    if os.path.exists(palika_index_path):
        with open(palika_index_path, "r", encoding="utf-8") as f:
            pk_data = json.load(f)

        existing_pcodes = set(r[0] for r in db.query(Municipality.pcode).all())
        new_palikas = []
        for pcode, pinfo in pk_data.items():
            if pcode not in existing_pcodes:
                dist_name = pinfo.get("district")
                parent_d = district_objs.get(dist_name)
                palika_obj = Municipality(
                    pcode=pcode,
                    district_id=parent_d.id if parent_d else None,
                    district_name=dist_name or "Unknown",
                    palika_name=pinfo.get("palika", "Unnamed Palika"),
                    area_sqkm=pinfo.get("area_sqkm"),
                    total_events=pinfo.get("events", 0),
                    total_deaths=pinfo.get("deaths", 0),
                    total_missing=pinfo.get("missing", 0),
                    total_injured=pinfo.get("injured", 0),
                    people_affected=pinfo.get("people_affected", 0),
                    houses_destroyed=pinfo.get("houses_destroyed", 0),
                    hazard_breakdown=pinfo.get("by_hazard", {}),
                    worst_event=pinfo.get("worst", {})
                )
                new_palikas.append(palika_obj)

        if new_palikas:
            db.bulk_save_objects(new_palikas)
            db.commit()
            logger.info(f"Loaded {len(new_palikas)} municipalities into database.")

def load_historical_events(db: Session):
    events_path = os.path.join(os.getcwd(), "data", "processed", "events.geojson")
    if not os.path.exists(events_path):
        raise FileNotFoundError(f"Required events dataset missing: {events_path}")

    # Map district names to IDs
    dist_map = {d.district_name: d.id for d in db.query(District).all()}

    with open(events_path, "r", encoding="utf-8") as f:
        events_data = json.load(f)

    features = events_data.get("features", [])
    logger.info(f"Reading {len(features)} events from events.geojson...")

    # Load in chunks for high performance
    chunk_size = 2000
    events_to_add = []
    
    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [0.0, 0.0])
        
        event_id = props.get("id")
        date_str = props.get("date")
        if not event_id or not date_str:
            continue
            
        try:
            event_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            continue

        dname = props.get("district", "Unknown")
        dist_id = dist_map.get(dname)
        
        ev_obj = HistoricalEvent(
            event_id=event_id,
            source=props.get("source", "bipad"),
            date=event_date,
            year=props.get("year", event_date.year),
            month=props.get("month", event_date.month),
            date_precision=props.get("date_precision", "day"),
            hazard_type=props.get("hazard", "landslide"),
            district=dname,
            district_id=dist_id,
            municipality=props.get("palika"),
            palika_pcode=props.get("palika_pcode"),
            latitude=coords[1],
            longitude=coords[0],
            geo_precision=props.get("geo_precision", "exact"),
            severity_score=props.get("severity_score", 0.0),
            severity_class=props.get("severity_class", "moderate"),
            title=props.get("title"),
            deaths=props.get("deaths", 0),
            missing=props.get("missing", 0),
            injured=props.get("injured", 0),
            people_affected=props.get("people_affected", 0),
            houses_destroyed=props.get("houses_destroyed", 0),
            houses_damaged=props.get("houses_damaged", 0),
            source_url=props.get("source_url"),
            report_sources=props.get("report_sources"),
            notes=props.get("notes")
        )
        events_to_add.append(ev_obj)

        if len(events_to_add) >= chunk_size:
            db.bulk_save_objects(events_to_add)
            db.commit()
            events_to_add = []

    if events_to_add:
        db.bulk_save_objects(events_to_add)
        db.commit()

    total_events = db.query(HistoricalEvent).count()
    logger.info(f"Loaded {total_events} historical events into database.")

def run_initial_risk_assessments(db: Session):
    """
    Computes initial baseline risk assessments for all 77 districts
    using rain.json baseline values and historical metrics.
    """
    data_dir = os.path.join(os.getcwd(), "data", "processed")
    rain_path = os.path.join(data_dir, "rain.json")
    rain_districts = {}
    if os.path.exists(rain_path):
        try:
            with open(rain_path, "r", encoding="utf-8") as f:
                rdata = json.load(f)
                rain_districts = rdata.get("districts", {})
        except Exception as e:
            logger.warning(f"Could not load rain.json: {e}")

    # Clear any previous assessments before recalculating
    db.query(RiskAssessment).delete()
    db.query(AgricultureRisk).delete()
    db.commit()

    districts = db.query(District).all()
    for d in districts:
        rain_info = rain_districts.get(d.district_name, {})
        mm_24h = rain_info.get("mm_24h", 5.0)
        mm_win = rain_info.get("mm_win", 12.0)
        
        # Approximate historical event counts
        hazard_bd = d.hazard_breakdown or {}
        flood_count = hazard_bd.get("flood", 0)
        landslide_count = hazard_bd.get("landslide", 0)

        # Standard topographic estimate based on elevation
        elev = 1400.0
        slope = 26.0
        if d.province in ["Madhesh", "Lumbini"]:
            elev = 180.0
            slope = 4.0
        elif d.province in ["Karnali", "Sudurpashchim"]:
            elev = 2200.0
            slope = 32.0

        risk_out = calculate_district_risk(
            district_name=d.district_name,
            rain_1h=round(mm_24h / 8.0, 1),
            rain_3h=round(mm_24h / 4.0, 1),
            rain_6h=round(mm_24h / 2.0, 1),
            rain_12h=round(mm_24h * 0.8, 1),
            rain_24h=mm_24h,
            rain_48h=mm_win * 0.7,
            rain_72h=mm_win,
            forecast_24h=12.0,
            forecast_48h=25.0,
            historical_flood_count=flood_count,
            historical_landslide_count=landslide_count,
            slope_deg=slope,
            elev_m=elev,
            hand_m=120.0 if slope < 10 else 380.0,
            temperature_c=22.0,
            soil_moisture=0.32
        )

        assessment = RiskAssessment(
            district_id=d.id,
            district_name=d.district_name,
            overall_risk_score=risk_out["overall_risk_score"],
            overall_risk_level=risk_out["overall_risk_level"],
            flood_risk_score=risk_out["flood_risk_score"],
            flood_risk_level=risk_out["flood_risk_level"],
            landslide_risk_score=risk_out["landslide_risk_score"],
            landslide_risk_level=risk_out["landslide_risk_level"],
            rainfall_risk_score=risk_out["rainfall_risk_score"],
            rainfall_risk_level=risk_out["rainfall_risk_level"],
            agriculture_risk_score=risk_out["agriculture_risk_score"],
            agriculture_risk_level=risk_out["agriculture_risk_level"],
            risk_factors=risk_out["risk_factors"],
            explanation=risk_out["explanation"],
            confidence=risk_out["confidence"],
            risk_engine_version=risk_out["risk_engine_version"],
            inputs_snapshot=risk_out["inputs_snapshot"],
            sources_used=risk_out["sources_used"],
            calculated_at=risk_out["calculated_at"],
            valid_until=risk_out["valid_until"]
        )
        db.add(assessment)

        # Agriculture Risk
        agri_data = risk_out["agriculture_data"]
        agri_obj = AgricultureRisk(
            district_id=d.id,
            district_name=d.district_name,
            crop_risk_level=agri_data["crop_risk_level"],
            risk_score=agri_data["risk_score"],
            rainfall_stress_level=agri_data["rainfall_stress_level"],
            temperature_stress_level=agri_data["temperature_stress_level"],
            flood_exposure_level=agri_data["flood_exposure_level"],
            landslide_exposure_level=agri_data["landslide_exposure_level"],
            soil_moisture_condition=agri_data["soil_moisture_condition"],
            recent_rainfall_mm=mm_24h,
            forecast_rainfall_mm=12.0,
            avg_temperature_c=22.0,
            soil_moisture_val=0.32,
            guidance_label=agri_data["guidance_label"],
            suggested_actions=agri_data["suggested_actions"],
            risk_summary=agri_data["risk_summary"],
            calculated_at=risk_out["calculated_at"],
            valid_until=risk_out["valid_until"]
        )
        db.add(agri_obj)

        # Evaluate and create initial alerts
        evaluate_and_create_alerts(db, d, risk_out)

    db.commit()
    logger.info("Initialized baseline risk assessments and alerts for all 77 districts.")
