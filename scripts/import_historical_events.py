import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.database import init_db, SessionLocal
from app.ingestion.data_loader import load_all_data_if_needed

def main():
    print("=" * 60)
    print("MausamGuard Nepal - Database Seeding & Data Ingestion")
    print("=" * 60)
    init_db()
    db = SessionLocal()
    try:
        load_all_data_if_needed(db)
        print("[SUCCESS] All data successfully loaded into database.")
    except Exception as e:
        print(f"[FAIL] Ingestion error: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
