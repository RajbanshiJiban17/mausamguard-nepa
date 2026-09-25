import os
import json
import logging
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger("mausamguard.palika")

_palikas_by_district: Dict[str, List[Dict[str, Any]]] = {}
_palika_coords: Dict[str, Tuple[float, float]] = {}
_is_loaded = False

def _find_geojson_path() -> Optional[str]:
    possible_paths = [
        os.path.join(os.getcwd(), "data", "processed", "palikas.geojson"),
        os.path.join(os.getcwd(), "..", "data", "processed", "palikas.geojson"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed", "palikas.geojson"),
    ]
    for p in possible_paths:
        abs_p = os.path.abspath(p)
        if os.path.exists(abs_p):
            return abs_p
    return None

def load_palika_catalog() -> None:
    global _is_loaded, _palikas_by_district, _palika_coords
    if _is_loaded:
        return

    path = _find_geojson_path()
    if not path:
        logger.warning("palikas.geojson not found in expected paths. Falling back to default heuristics.")
        _is_loaded = True
        return

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        features = data.get("features", [])
        for feat in features:
            props = feat.get("properties", {})
            d_name = props.get("adm2_name", "").strip()
            p_name = props.get("adm3_name", "").strip()
            pcode = props.get("adm3_pcode", "").strip()
            area_sqkm = props.get("area_sqkm", 0.0)
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])

            all_pts = []
            if geom.get("type") == "Polygon":
                for ring in coords:
                    all_pts.extend(ring)
            elif geom.get("type") == "MultiPolygon":
                for poly in coords:
                    for ring in poly:
                        all_pts.extend(ring)

            if all_pts:
                avg_lon = sum(pt[0] for pt in all_pts) / len(all_pts)
                avg_lat = sum(pt[1] for pt in all_pts) / len(all_pts)
            else:
                avg_lon, avg_lat = 0.0, 0.0

            centroid = (round(avg_lat, 5), round(avg_lon, 5))
            d_key = d_name.lower()
            p_key = p_name.lower()

            if d_key not in _palikas_by_district:
                _palikas_by_district[d_key] = []

            _palikas_by_district[d_key].append({
                "palika_name": p_name,
                "district_name": d_name,
                "pcode": pcode,
                "area_sqkm": area_sqkm,
                "latitude": centroid[0],
                "longitude": centroid[1]
            })

            # Key lookups
            _palika_coords[f"{d_key}:{p_key}"] = centroid
            if p_key not in _palika_coords:
                _palika_coords[p_key] = centroid

        logger.info(f"Loaded {len(_palika_coords)} palikas across {len(_palikas_by_district)} districts from {path}")
        _is_loaded = True
    except Exception as e:
        logger.error(f"Failed to load palikas.geojson: {e}")
        _is_loaded = True

def get_palikas_for_district(district_name: str) -> List[Dict[str, Any]]:
    load_palika_catalog()
    return _palikas_by_district.get(district_name.lower().strip(), [])

def get_palika_coords(district_name: Optional[str], palika_name: str) -> Optional[Tuple[float, float]]:
    load_palika_catalog()
    p_key = palika_name.lower().strip()
    
    # Check specific district + palika
    if district_name:
        d_key = district_name.lower().strip()
        key = f"{d_key}:{p_key}"
        if key in _palika_coords:
            return _palika_coords[key]
            
    # Check direct palika
    if p_key in _palika_coords:
        return _palika_coords[p_key]

    # Partial / fuzzy match
    for k, coords in _palika_coords.items():
        if p_key in k:
            return coords

    # Known fallback centroids for Kailali key palikas
    known_kailali = {
        "joshipur": (28.57555, 81.02567),
        "bhajani": (28.5175, 80.9681),
        "tikapur": (28.4852, 81.0782),
        "dhangadhi": (28.7031, 80.6618),
        "kailari": (28.6200, 80.8500),
    }
    if p_key in known_kailali:
        return known_kailali[p_key]

    return None
