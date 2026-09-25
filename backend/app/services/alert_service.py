import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.district import District
from app.utils.timezone import utc_now

logger = logging.getLogger("mausamguard.alerts")

PRIORITY_MAP = {
    "LOW": "INFO",
    "MODERATE": "WATCH",
    "HIGH": "WARNING",
    "VERY HIGH": "HIGH WARNING",
    "CRITICAL": "CRITICAL"
}

def generate_alert_fingerprint(district: str, hazard: str, risk_level: str, trigger_type: str) -> str:
    """Generate unique deduplication fingerprint."""
    return f"{district.lower().strip()}:{hazard.lower()}:{risk_level.upper()}:{trigger_type.lower()}"

def evaluate_and_create_alerts(
    db: Session,
    district: District,
    risk_assessment: Dict[str, Any]
) -> List[Alert]:
    """
    Evaluates risk outputs against alert rules, creates alerts with deduplication,
    escalation handling, and expiration management.
    """
    new_alerts: List[Alert] = []
    now = utc_now()
    expires_at = now + timedelta(days=3)
    
    district_name = district.district_name
    overall_level = risk_assessment["overall_risk_level"]
    flood_level = risk_assessment["flood_risk_level"]
    landslide_level = risk_assessment["landslide_risk_level"]
    agri_level = risk_assessment["agriculture_risk_level"]
    
    hazards_to_evaluate = [
        ("flood", flood_level, risk_assessment["flood_risk_score"]),
        ("landslide", landslide_level, risk_assessment["landslide_risk_score"]),
        ("agriculture", agri_level, risk_assessment["agriculture_risk_score"])
    ]
    
    for hazard, level, score in hazards_to_evaluate:
        # We trigger alerts for MODERATE, HIGH, VERY HIGH, CRITICAL
        if level in ["MODERATE", "HIGH", "VERY HIGH", "CRITICAL"]:
            priority = PRIORITY_MAP.get(level, "INFO")
            trigger_type = f"{hazard}_threshold_exceeded"
            fingerprint = generate_alert_fingerprint(district_name, hazard, level, trigger_type)
            
            # Check for existing ACTIVE alert with the same fingerprint
            existing_alert = db.query(Alert).filter(
                Alert.district_id == district.id,
                Alert.hazard == hazard,
                Alert.status == "ACTIVE"
            ).first()
            
            # Formulate professional, calibrated non-deterministic alert message (Requirement 13)
            hazard_display = hazard.replace("_", " ").capitalize()
            if level in ["VERY HIGH", "CRITICAL"]:
                message = (
                    f"Potential {level.lower()} {hazard_display} risk detected in {district_name} district "
                    f"due to elevated recent rainfall, forecast precipitation, and terrain susceptibility factors. "
                    f"Local communities in vulnerable tracts are advised to monitor conditions closely."
                )
            elif level == "HIGH":
                message = (
                    f"Elevated {hazard_display} risk monitored for {district_name} district. "
                    f"Antecedent precipitation and local slope/drainage factors indicate increased hazard potential."
                )
            else: # MODERATE
                message = (
                    f"Moderate {hazard_display} advisory in {district_name} district. "
                    f"Routine seasonal monitoring recommended."
                )
                
            trigger_factors = risk_assessment.get("risk_factors", [])
            
            if existing_alert:
                # If risk level has changed, update/escalate
                if existing_alert.risk_level != level:
                    existing_alert.risk_level = level
                    existing_alert.priority = priority
                    existing_alert.score = score
                    existing_alert.message = message
                    existing_alert.trigger_factors = trigger_factors
                    existing_alert.expires_at = expires_at
                    existing_alert.updated_at = now
                    existing_alert.fingerprint = fingerprint
                    db.add(existing_alert)
                    logger.info(f"Escalated alert for {district_name} ({hazard}): {level}")
                else:
                    # Extend expiry if condition persists
                    existing_alert.expires_at = expires_at
                    db.add(existing_alert)
            else:
                # Create brand new alert
                alert_code = f"ALT-{now.strftime('%Y%m%d')}-{district_name[:4].upper()}-{str(uuid.uuid4())[:4].upper()}"
                alert_obj = Alert(
                    alert_id=alert_code,
                    fingerprint=fingerprint,
                    district=district_name,
                    district_id=district.id,
                    hazard=hazard,
                    risk_level=level,
                    priority=priority,
                    score=score,
                    message=message,
                    trigger_factors=trigger_factors,
                    source="MausamGuard Early Warning Engine",
                    data_timestamp=now,
                    status="ACTIVE",
                    acknowledged=False,
                    created_at=now,
                    updated_at=now,
                    expires_at=expires_at
                )
                db.add(alert_obj)
                new_alerts.append(alert_obj)
                logger.info(f"Created new {priority} alert for {district_name} ({hazard})")
                
    # Expire out-of-date active alerts
    db.query(Alert).filter(
        Alert.status == "ACTIVE",
        Alert.expires_at < now
    ).update({"status": "EXPIRED"})
    
    db.commit()
    return new_alerts
