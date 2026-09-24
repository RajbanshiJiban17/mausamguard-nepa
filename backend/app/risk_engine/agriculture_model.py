from typing import Dict, Any, Tuple, List

def calculate_agriculture_risk(
    rain_24h: float,
    forecast_24h: float,
    flood_risk_level: str,
    landslide_risk_level: str,
    temperature_c: float = 22.0,
    soil_moisture: float = 0.30
) -> Dict[str, Any]:
    """
    Dedicated agriculture risk calculation for crops and soil conditions.
    Explicitly labeled as General agriculture risk guidance.
    """
    score = 0.0
    suggested_actions = []
    
    # 1. Rainfall Stress
    if rain_24h > 90.0:
        rainfall_stress = "SEVERE_EXCESS"
        score += 35
        suggested_actions.append("Clear field drainage channels immediately to prevent root inundation and standing water.")
        suggested_actions.append("Postpone chemical fertilizer and pesticide applications until heavy rainfall ceases.")
    elif rain_24h > 45.0:
        rainfall_stress = "EXCESS"
        score += 20
        suggested_actions.append("Monitor terrace outlets and low-lying plots for localized water accumulation.")
    elif rain_24h < 1.0 and forecast_24h < 2.0:
        rainfall_stress = "DEFICIT"
        score += 15
        suggested_actions.append("Assess soil moisture in vegetable nursery and rainfed cereal plots; schedule supplemental irrigation if accessible.")
    else:
        rainfall_stress = "NORMAL"

    # 2. Temperature Stress
    if temperature_c is not None:
        if temperature_c <= 3.0:
            temp_stress = "COLD_STRESS"
            score += 20
            suggested_actions.append("Protect high-altitude nursery beds with plastic mulch or straw coverings against night frost.")
        elif temperature_c >= 36.0:
            temp_stress = "HEAT_STRESS"
            score += 15
            suggested_actions.append("Provide shading or light frequent morning irrigations for sensitive horticulture crops.")
        else:
            temp_stress = "OPTIMAL"
    else:
        temp_stress = "NORMAL"

    # 3. Flood & Landslide Exposure Integration
    if flood_risk_level in ["CRITICAL", "VERY HIGH"]:
        score += 30
        suggested_actions.append("Move harvested grain, machinery, and livestock to elevated ground above flood hazard zones.")
    elif flood_risk_level == "HIGH":
        score += 18
        suggested_actions.append("Reinforce bunds and inspect riverbank agricultural terraces.")

    if landslide_risk_level in ["CRITICAL", "VERY HIGH"]:
        score += 25
        suggested_actions.append("Avoid working on steep, water-saturated hillside terraces during continuous heavy rains.")
    elif landslide_risk_level == "HIGH":
        score += 12

    # 4. Soil Moisture Condition
    if soil_moisture >= 0.45:
        soil_cond = "WATERLOGGED"
        score += 15
    elif soil_moisture >= 0.35:
        soil_cond = "SATURATED"
        score += 8
    elif soil_moisture <= 0.12:
        soil_cond = "DRY"
        score += 10
    else:
        soil_cond = "OPTIMAL"

    score = min(100.0, max(0.0, score))

    if score >= 65:
        crop_risk_level = "VERY HIGH"
        summary = "Severe agricultural risk due to extreme rainfall/flood exposure. Urgent crop and asset protection needed."
    elif score >= 45:
        crop_risk_level = "HIGH"
        summary = "Elevated agricultural risk. Waterlogging, nutrient leaching, or terrain hazard may impact standing crops."
    elif score >= 25:
        crop_risk_level = "MODERATE"
        summary = "Moderate weather impact on farming operations. Routine soil and drainage monitoring advised."
    else:
        crop_risk_level = "LOW"
        summary = "Weather and soil conditions are currently favorable for general regional farming activities."
        if not suggested_actions:
            suggested_actions.append("Maintain routine seasonal weeding, field scouting, and standard crop management practices.")

    return {
        "crop_risk_level": crop_risk_level,
        "risk_score": round(score, 1),
        "rainfall_stress_level": rainfall_stress,
        "temperature_stress_level": temp_stress,
        "flood_exposure_level": flood_risk_level,
        "landslide_exposure_level": landslide_risk_level,
        "soil_moisture_condition": soil_cond,
        "guidance_label": "General agriculture risk guidance",
        "suggested_actions": suggested_actions,
        "risk_summary": summary
    }
