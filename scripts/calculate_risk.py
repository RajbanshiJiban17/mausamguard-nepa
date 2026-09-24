import os
import sys

sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.ingestion.data_loader import run_initial_risk_assessments
from app.models.risk import RiskAssessment

def main():
    print("=" * 60)
    print("MausamGuard Nepal - Multi-Hazard Risk Recalculation")
    print("=" * 60)
    db = SessionLocal()
    try:
        run_initial_risk_assessments(db)
        total_risks = db.query(RiskAssessment).count()
        print(f"[SUCCESS] Recalculated risk assessments across all {total_risks} districts.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
