from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.risk_engine.flood_model import calculate_flood_risk
from app.risk_engine.landslide_model import calculate_landslide_risk
from app.risk_engine.agriculture_model import calculate_agriculture_risk
from app.utils.timezone import utc_now

def calculate_district_risk(
    district_name: str,
    rain_1h: float = 0.0,
    rain_3h: float = 0.0,
    rain_6h: float = 0.0,
    rain_12h: float = 0.0,
    rain_24h: float = 0.0,
    rain_48h: float = 0.0,
    rain_72h: float = 0.0,
    forecast_24h: float = 0.0,
    forecast_48h: float = 0.0,
    historical_flood_count: int = 0,
    historical_landslide_count: int = 0,
    river_status: str = "Below warning",
    river_trend: str = "Steady",
    slope_deg: float = 26.0,
    elev_m: float = 1400.0,
    hand_m: float = 250.0,
    temperature_c: float = 20.0,
    soil_moisture: float = 0.30
) -> Dict[str, Any]:
    """
    Master risk calculation orchestrator for a given district.
    Outputs reproducible, explainable multi-hazard risk assessment.
    """
    # 1. Flood Risk
    flood_score, flood_level, flood_factors = calculate_flood_risk(
        rain_1h=rain_1h,
        rain_3h=rain_3h,
        rain_6h=rain_6h,
        rain_12h=rain_12h,
        rain_24h=rain_24h,
        forecast_24h=forecast_24h,
        historical_flood_events=historical_flood_count,
        river_status=river_status,
        river_trend=river_trend,
        hand_val=hand_m
    )

    # 2. Landslide Risk
    landslide_score, landslide_level, landslide_factors = calculate_landslide_risk(
        rain_24h=rain_24h,
        rain_48h=rain_48h,
        rain_72h=rain_72h,
        forecast_24h=forecast_24h,
        historical_landslide_events=historical_landslide_count,
        slope_deg=slope_deg,
        elev_m=elev_m,
        soil_moisture=soil_moisture
    )

    # 3. Rainfall Risk (standalone meteorological severity)
    rain_score = min(100.0, (rain_24h / 140.0) * 60.0 + (forecast_24h / 100.0) * 40.0)
    if rain_score >= 80:
        rain_level = "CRITICAL"
    elif rain_score >= 60:
        rain_level = "VERY HIGH"
    elif rain_score >= 40:
        rain_level = "HIGH"
    elif rain_score >= 20:
        rain_level = "MODERATE"
    else:
        rain_level = "LOW"

    # 4. Agriculture Risk
    agri_result = calculate_agriculture_risk(
        rain_24h=rain_24h,
        forecast_24h=forecast_24h,
        flood_risk_level=flood_level,
        landslide_risk_level=landslide_level,
        temperature_c=temperature_c,
        soil_moisture=soil_moisture
    )

    # 5. Composite Overall Risk Score (Hazard weighted maximum)
    # The overall risk reflects the most severe active hazard with dampening
    max_hazard = max(flood_score, landslide_score, rain_score)
    mean_hazard = (flood_score + landslide_score + rain_score) / 3.0
    overall_score = round(0.75 * max_hazard + 0.25 * mean_hazard, 1)

    if overall_score >= 75:
        overall_level = "CRITICAL"
    elif overall_score >= 60:
        overall_level = "VERY HIGH"
    elif overall_score >= 40:
        overall_level = "HIGH"
    elif overall_score >= 20:
        overall_level = "MODERATE"
    else:
        overall_level = "LOW"

    # Compile Consolidated Risk Factors & Natural Language Explanation (Requirement 42)
    consolidated_factors: List[str] = []
    if flood_level in ["HIGH", "VERY HIGH", "CRITICAL"]:
        consolidated_factors.extend([f"Flood: {f}" for f in flood_factors[:3]])
    if landslide_level in ["HIGH", "VERY HIGH", "CRITICAL"]:
        consolidated_factors.extend([f"Landslide: {f}" for f in landslide_factors[:3]])
    if not consolidated_factors:
        if flood_factors:
            consolidated_factors.append(flood_factors[0])
        if landslide_factors:
            consolidated_factors.append(landslide_factors[0])

    # Build human-readable explanation
    explanation_parts = [f"District {district_name} overall risk level is {overall_level} (Score: {overall_score}/100)."]
    if flood_level in ["HIGH", "VERY HIGH", "CRITICAL"]:
        explanation_parts.append(f"Elevated flood potential driven by rainfall and terrain metrics.")
    if landslide_level in ["HIGH", "VERY HIGH", "CRITICAL"]:
        explanation_parts.append(f"Elevated landslide risk driven by steep slope ({slope_deg:.1f}°) and antecedent saturation.")
    if overall_level == "LOW":
        explanation_parts.append("Current rainfall, river water levels, and antecedent saturation remain within normal baseline thresholds.")
    
    explanation = " ".join(explanation_parts)

    confidence = "HIGH" if (rain_24h is not None and forecast_24h is not None) else "MEDIUM"

    now = utc_now()
    valid_until = now + timedelta(hours=6)

    return {
        "district_name": district_name,
        "overall_risk_score": overall_score,
        "overall_risk_level": overall_level,
        "flood_risk_score": round(flood_score, 1),
        "flood_risk_level": flood_level,
        "landslide_risk_score": round(landslide_score, 1),
        "landslide_risk_level": landslide_level,
        "rainfall_risk_score": round(rain_score, 1),
        "rainfall_risk_level": rain_level,
        "agriculture_risk_score": agri_result["risk_score"],
        "agriculture_risk_level": agri_result["crop_risk_level"],
        "agriculture_data": agri_result,
        "risk_factors": consolidated_factors,
        "explanation": explanation,
        "confidence": confidence,
        "risk_engine_version": "1.0.0",
        "sources_used": [
            "Open-Meteo Weather API",
            "NASA GPM IMERG Late Precipitation",
            "DHM Nepal Warning Thresholds",
            "SRTM Terrain Model"
        ],
        "inputs_snapshot": {
            "rain_24h": rain_24h,
            "forecast_24h": forecast_24h,
            "river_status": river_status,
            "slope_deg": slope_deg,
            "hand_m": hand_m
        },
        "calculated_at": now,
        "valid_until": valid_until
    }
