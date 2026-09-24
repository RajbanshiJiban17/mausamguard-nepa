import os
import sys
import subprocess

def main():
    print("=" * 70)
    print("      MausamGuard Nepal - System Verification & Acceptance Run     ")
    print("=" * 70)

    # 1. Dataset validation
    print("\n[Step 1/4] Running dataset validation...")
    res = subprocess.run([sys.executable, "scripts/validate_dataset.py"])
    if res.returncode != 0:
        print("[FAIL] Dataset validation failed.")
        sys.exit(1)

    # 2. Database verification
    print("\n[Step 2/4] Verifying database integrity...")
    sys.path.insert(0, os.path.join(os.getcwd(), "backend"))
    from app.database import SessionLocal
    from app.models.district import District
    from app.models.event import HistoricalEvent

    db = SessionLocal()
    try:
        d_cnt = db.query(District).count()
        e_cnt = db.query(HistoricalEvent).count()
        print(f" -> Districts loaded:         {d_cnt} / 77")
        print(f" -> Historical events loaded: {e_cnt} / 13,185")
        if d_cnt < 77 or e_cnt < 10000:
            print("[FAIL] Incomplete database records.")
            sys.exit(1)
        print("[PASS] Database tables and records verified.")
    finally:
        db.close()

    # 3. Weather check
    print("\n[Step 3/4] Verifying Open-Meteo weather retrieval...")
    res = subprocess.run([sys.executable, "scripts/refresh_weather.py"])
    if res.returncode != 0:
        print("[FAIL] Weather check failed.")
        sys.exit(1)

    # 4. Run Pytest suite
    print("\n[Step 4/4] Running pytest backend test suite...")
    res = subprocess.run([sys.executable, "-m", "pytest", "backend/tests", "-v"])
    if res.returncode != 0:
        print("[FAIL] Pytest test suite failed.")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("       ALL SYSTEM VERIFICATION CHECKS PASSED SUCCESSFULLY!       ")
    print("=" * 70)

if __name__ == "__main__":
    main()
