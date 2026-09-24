import math
from typing import Dict, Any, Tuple, List
from app.config import settings

def calculate_flood_risk(
    rain_1h: float,
    rain_3h: float,
    rain_6h: float,
    rain_12h: float,
    rain_24h: float,
    forecast_24h: float,
    historical_flood_events: int,
    river_status: str = "Below warning",
    river_trend: str = "Steady",
    hand_val: float = 250.0 # Height Above Nearest Drainage in meters
) -> Tuple[float, str, List[str]]:
    """
    Transparent rule-based flood risk calculation incorporating DHM warning references,
    rainfall accumulation, river trends, and terrain proximity to drainage.
    """
    score = 0.0
    factors = []
    
    # 1. DHM Rainfall Threshold Reference Checks
    dhm_triggered = False
    if rain_1h >= settings.DHM_RAIN_1H_THRESHOLD:
        score += 35
        factors.append(f"1-hour rainfall ({rain_1h:.1f} mm) exceeds DHM warning reference ({settings.DHM_RAIN_1H_THRESHOLD} mm/1h)")
        dhm_triggered = True
    if rain_3h >= settings.DHM_RAIN_3H_THRESHOLD:
        score += 30
        factors.append(f"3-hour rainfall ({rain_3h:.1f} mm) exceeds DHM warning reference ({settings.DHM_RAIN_3H_THRESHOLD} mm/3h)")
        dhm_triggered = True
    if rain_6h >= settings.DHM_RAIN_6H_THRESHOLD:
        score += 25
        factors.append(f"6-hour rainfall ({rain_6h:.1f} mm) exceeds DHM warning reference ({settings.DHM_RAIN_6H_THRESHOLD} mm/6h)")
        dhm_triggered = True
    if rain_12h >= settings.DHM_RAIN_12H_THRESHOLD:
        score += 25
        factors.append(f"12-hour rainfall ({rain_12h:.1f} mm) exceeds DHM warning reference ({settings.DHM_RAIN_12H_THRESHOLD} mm/12h)")
        dhm_triggered = True
    if rain_24h >= settings.DHM_RAIN_24H_THRESHOLD:
        score += 30
        factors.append(f"24-hour rainfall ({rain_24h:.1f} mm) exceeds DHM warning reference ({settings.DHM_RAIN_24H_THRESHOLD} mm/24h)")
        dhm_triggered = True

    # 2. General Rainfall Accumulation Scoring if below strict DHM threshold
    if not dhm_triggered:
        if rain_24h > 70:
            score += 25
            factors.append(f"Significant 24-hour rainfall observed ({rain_24h:.1f} mm)")
        elif rain_24h > 35:
            score += 15
            factors.append(f"Moderate 24-hour rainfall observed ({rain_24h:.1f} mm)")
        elif rain_24h > 10:
            score += 5

    # 3. Forecast Precipitation (Next 24h)
    if forecast_24h >= 100:
        score += 25
        factors.append(f"Heavy forecast rainfall expected in next 24h ({forecast_24h:.1f} mm)")
    elif forecast_24h >= 50:
        score += 15
        factors.append(f"Moderate to heavy forecast rainfall in next 24h ({forecast_24h:.1f} mm)")
    elif forecast_24h >= 20:
        score += 5

    # 4. River Monitoring Condition
    if river_status == "Above danger":
        score += 35
        factors.append("Nearest river station is ABOVE DANGER level")
    elif river_status == "Above warning":
        score += 20
        factors.append("Nearest river station is ABOVE WARNING level")
    elif river_trend == "Rising":
        score += 8
        factors.append("River water level trend is RISING")

    # 5. Lowland Drainage / HAND (Height Above Nearest Drainage)
    if hand_val < 50.0:
        score += 15
        factors.append(f"Lowland flood-prone floodplain terrain (HAND: {hand_val:.1f} m)")
    elif hand_val < 150.0:
        score += 8

    # 6. Historical Flood Frequency Exposure
    if historical_flood_events >= 100:
        score += 12
        factors.append(f"High historical flood frequency ({historical_flood_events} recorded flood events)")
    elif historical_flood_events >= 40:
        score += 6

    # Normalization to 0-100 scale
    score = min(100.0, max(0.0, score))
    
    # Categorization
    if score >= 80:
        level = "CRITICAL"
    elif score >= 65:
        level = "VERY HIGH"
    elif score >= 45:
        level = "HIGH"
    elif score >= 25:
        level = "MODERATE"
    else:
        level = "LOW"
        if not factors:
            factors.append("Current rainfall and river metrics remain well below warning thresholds")
            
    return score, level, factors
