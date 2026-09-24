import os
import sys
import asyncio

sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.services.dhm_service import check_dhm_feed_status, DHM_BENCHMARK_STATIONS
from app.models.audit import DataSource

async def main():
    print("=" * 60)
    print("MausamGuard Nepal - DHM Portal & Feed Status Check")
    print("=" * 60)
    feed_info = await check_dhm_feed_status()
    print(f"DHM Portal Reachable: {feed_info['reachable']}")
    print(f"Feed Status:          {feed_info['feed_status']}")
    print(f"Status Label:         {feed_info['status_label']}")
    print(f"Diagnostic Message:   {feed_info['message']}")
    print("-" * 60)
    print(f"Monitoring {len(DHM_BENCHMARK_STATIONS)} benchmark river gauge stations:")
    for st in DHM_BENCHMARK_STATIONS:
        print(f" - [{st['station_id']}] {st['station_name']} ({st['basin']} Basin): Warning {st['warning_level_m']}m, Danger {st['danger_level_m']}m")
    print("[SUCCESS] DHM status checked and logged.")

if __name__ == "__main__":
    asyncio.run(main())
