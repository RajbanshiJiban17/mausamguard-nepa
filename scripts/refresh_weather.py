import os
import sys
import asyncio

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.models.district import District
from app.services.weather_service import fetch_open_meteo_weather

async def main():
    print("=" * 60)
    print("MausamGuard Nepal - Live Weather Refresh (Open-Meteo)")
    print("=" * 60)
    db = SessionLocal()
    try:
        districts = db.query(District).limit(10).all()
        print(f"Refreshing live weather for {len(districts)} regional hub districts...")
        for d in districts:
            w = await fetch_open_meteo_weather(d.latitude, d.longitude, d.district_name)
            current = w.get("current", {})
            temp = current.get("temperature_2m", "N/A")
            rain = current.get("precipitation", 0.0)
            status = w.get("status", "UNKNOWN")
            print(f"[{status}] {d.district_name:<20}: Temp {temp}°C, Precip {rain} mm")
            await asyncio.sleep(0.3)
        print("[SUCCESS] Weather observations successfully updated and cached.")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
