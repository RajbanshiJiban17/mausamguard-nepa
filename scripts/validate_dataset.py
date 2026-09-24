import os
import sys
import json
from datetime import datetime, timezone

def validate_dataset():
    print("=" * 60)
    print("MausamGuard Nepal - Dataset Integrity & 77-District Validation")
    print("=" * 60)

    data_dir = os.path.join(os.getcwd(), "data", "processed")
    if not os.path.exists(data_dir):
        print(f"[FAIL] Data directory not found at: {data_dir}")
        sys.exit(1)

    required_files = [
        "districts.geojson",
        "districts_boundary.geojson",
        "district_index.json",
        "events.geojson",
        "palikas.geojson",
        "palika_index.json",
        "rain.json",
        "risk_model.json"
    ]

    for rf in required_files:
        p = os.path.join(data_dir, rf)
        if not os.path.exists(p):
            print(f"[FAIL] Required dataset file missing: {rf}")
            sys.exit(1)
        size_kb = os.path.getsize(p) / 1024
        print(f"[OK] Found {rf:<28} ({size_kb:.1f} KB)")

    # 1. Validate 77 Districts Coverage
    with open(os.path.join(data_dir, "districts.geojson"), "r", encoding="utf-8") as f:
        dg = json.load(f)
    with open(os.path.join(data_dir, "district_index.json"), "r", encoding="utf-8") as f:
        di = json.load(f)
    with open(os.path.join(data_dir, "districts_boundary.geojson"), "r", encoding="utf-8") as f:
        db = json.load(f)

    d_geojson = set(feat["properties"]["district"] for feat in dg.get("features", []))
    d_index = set(di.keys())
    d_boundary = set(feat["properties"]["adm2_name"] for feat in db.get("features", []))

    print("-" * 60)
    print(f"Districts in districts.geojson:          {len(d_geojson)}")
    print(f"Districts in district_index.json:       {len(d_index)}")
    print(f"Districts in districts_boundary.geojson:{len(d_boundary)}")

    if len(d_geojson) != 77 or len(d_index) != 77 or len(d_boundary) != 77:
        print("[FAIL] Expected exactly 77 districts across all administrative files.")
        sys.exit(1)

    diff = (d_geojson ^ d_index) | (d_geojson ^ d_boundary)
    if diff:
        print(f"[FAIL] District naming discrepancy detected: {diff}")
        sys.exit(1)
    print("[PASS] Complete 77-District boundary and catalog alignment verified.")

    # 2. Validate Historical Events
    print("-" * 60)
    print("Inspecting historical events dataset (events.geojson)...")
    with open(os.path.join(data_dir, "events.geojson"), "r", encoding="utf-8") as f:
        eg = json.load(f)

    features = eg.get("features", [])
    total_events = len(features)
    print(f"Total events found: {total_events}")

    if total_events == 0:
        print("[FAIL] events.geojson contains 0 features.")
        sys.exit(1)

    missing_coords = 0
    invalid_dates = 0
    impossible_negatives = 0
    covered_districts = set()
    hazards = {}
    sources = {}
    dates = []

    required_props = ["id", "date", "hazard", "district"]

    for i, feat in enumerate(features):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])

        # Check required fields
        for rp in required_props:
            if rp not in props or props[rp] is None:
                print(f"[FAIL] Event index {i} missing required property: {rp}")
                sys.exit(1)

        # Coordinate check
        if not coords or len(coords) < 2 or coords[0] == 0.0 or coords[1] == 0.0:
            missing_coords += 1

        # Date check
        d_str = props["date"]
        try:
            d_obj = datetime.strptime(d_str, "%Y-%m-%d")
            dates.append(d_str)
        except Exception:
            invalid_dates += 1

        # Negatives check
        if props.get("deaths", 0) < 0 or props.get("missing", 0) < 0 or props.get("injured", 0) < 0:
            impossible_negatives += 1

        d_name = props.get("district")
        if d_name:
            covered_districts.add(d_name)

        h = props.get("hazard", "unknown")
        hazards[h] = hazards.get(h, 0) + 1

        s = props.get("source", "unknown")
        sources[s] = sources.get(s, 0) + 1

    dates.sort()
    date_min = dates[0] if dates else ""
    date_max = dates[-1] if dates else ""

    print(f"Districts with recorded events: {len(covered_districts)} / 77")
    print(f"Date range:                     {date_min} to {date_max}")
    print(f"Hazard breakdown:               {hazards}")
    print(f"Source breakdown:               {sources}")
    print(f"Missing coordinates:            {missing_coords}")
    print(f"Invalid dates:                  {invalid_dates}")
    print(f"Impossible negative casualties: {impossible_negatives}")

    # Generate data_quality_report.json
    report = {
        "dataset_name": "MausamGuard Nepal Multi-Hazard Historical Disaster Dataset",
        "validation_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_records": total_events,
        "valid_records": total_events - (missing_coords + invalid_dates),
        "invalid_records": missing_coords + invalid_dates,
        "missing_coordinates": missing_coords,
        "invalid_dates": invalid_dates,
        "impossible_negatives": impossible_negatives,
        "districts_covered": len(covered_districts),
        "expected_districts": 77,
        "hazards_distribution": hazards,
        "source_coverage": sources,
        "date_range": {"min": date_min, "max": date_max},
        "overall_status": "PASS" if (missing_coords == 0 and invalid_dates == 0) else "WARNING"
    }

    report_path = os.path.join(os.getcwd(), "data_quality_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("-" * 60)
    print(f"[SUCCESS] Dataset validation passed. Report written to {report_path}")
    print("=" * 60)

if __name__ == "__main__":
    validate_dataset()
