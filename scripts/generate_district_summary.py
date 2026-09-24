import os
import sys
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.models.district import District
from app.models.risk import RiskAssessment
from app.models.alert import Alert

def main():
    print("=" * 60)
    print("MausamGuard Nepal - District Analytics Summary Generator")
    print("=" * 60)
    db = SessionLocal()
    try:
        districts = db.query(District).order_by(District.district_name.asc()).all()
        summary_list = []

        for d in districts:
            latest_risk = db.query(RiskAssessment).filter(
                RiskAssessment.district_id == d.id
            ).order_by(RiskAssessment.calculated_at.desc()).first()

            alert_count = db.query(Alert).filter(
                Alert.district_id == d.id,
                Alert.status == "ACTIVE"
            ).count()

            summary_list.append({
                "district_id": d.id,
                "district_name": d.district_name,
                "province": d.province,
                "population": d.population,
                "total_historical_events": d.total_events,
                "total_deaths": d.total_deaths,
                "overall_risk_level": latest_risk.overall_risk_level if latest_risk else "LOW",
                "overall_risk_score": latest_risk.overall_risk_score if latest_risk else 0.0,
                "flood_risk_level": latest_risk.flood_risk_level if latest_risk else "LOW",
                "landslide_risk_level": latest_risk.landslide_risk_level if latest_risk else "LOW",
                "agriculture_risk_level": latest_risk.agriculture_risk_level if latest_risk else "LOW",
                "active_alerts_count": alert_count,
                "top_risk_factors": latest_risk.risk_factors[:3] if latest_risk else []
            })

        output_path = os.path.join(os.getcwd(), "district_summary_report.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump({
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "total_districts": len(summary_list),
                "districts": summary_list
            }, f, indent=2)

        print(f"[SUCCESS] Generated summary report for {len(summary_list)} districts at: {output_path}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
