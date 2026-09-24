import math
from typing import Dict, Any, Tuple, List

# Parameters from data/processed/risk_model.json (held-out AUC = 0.783)
TERRAIN_MEANS = [392.714, 26.338, 36.072, 370.477, 2040.017]
TERRAIN_SCALES = [310.378, 14.204, 16.685, 245.063, 1664.65]
TERRAIN_COEFS = [0.4684, 0.5098, 0.6999, -0.0052, -1.6923]
TERRAIN_INTERCEPT = -0.0805

def compute_terrain_landslide_susceptibility(
    hand: float = 400.0,
    slope_deg: float = 28.0,
    steep_near: float = 38.0,
    relief_up: float = 360.0,
    elev: float = 1800.0
) -> float:
    """
    Computes terrain susceptibility probability (0.0 to 1.0) using
    logistic regression model calibrated on SRTM terrain features.
    """
    inputs = [hand, slope_deg, steep_near, relief_up, elev]
    z = TERRAIN_INTERCEPT
    for i in range(5):
        standardized = (inputs[i] - TERRAIN_MEANS[i]) / (TERRAIN_SCALES[i] if TERRAIN_SCALES[i] != 0 else 1.0)
        z += TERRAIN_COEFS[i] * standardized
    # Logistic sigmoid
    prob = 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, z))))
    return prob

def calculate_landslide_risk(
    rain_24h: float,
    rain_48h: float,
    rain_72h: float,
    forecast_24h: float,
    historical_landslide_events: int,
    slope_deg: float = 28.0,
    elev_m: float = 1600.0,
    soil_moisture: float = 0.35
) -> Tuple[float, str, List[str]]:
    """
    Hybrid landslide risk calculation combining terrain susceptibility (SRTM)
    with antecedent rainfall accumulation (24h/48h/72h), soil moisture, and forecast.
    """
    score = 0.0
    factors = []

    # 1. Terrain Susceptibility component (0 to 35 points)
    terrain_prob = compute_terrain_landslide_susceptibility(
        hand=380.0,
        slope_deg=slope_deg,
        steep_near=slope_deg * 1.2,
        relief_up=350.0,
        elev=elev_m
    )
    terrain_score = terrain_prob * 35.0
    score += terrain_score

    if slope_deg >= 30.0:
        factors.append(f"Steep slope terrain ({slope_deg:.1f}°)")
    elif slope_deg >= 22.0:
        factors.append(f"Moderately steep terrain ({slope_deg:.1f}°)")

    # 2. Antecedent Rainfall Accumulation (24h, 48h, 72h) - 0 to 40 points
    # Landslides in Nepal commonly trigger after prolonged antecedent saturation
    api_72h = 0.5 * (rain_72h - rain_48h if rain_72h >= rain_48h else 0) + \
              0.8 * (rain_48h - rain_24h if rain_48h >= rain_24h else 0) + \
              1.2 * rain_24h

    if rain_24h >= 100.0 or api_72h >= 140.0:
        score += 35
        factors.append(f"Extreme 24-72h antecedent rainfall accumulation ({rain_24h:.1f} mm / 24h, {rain_72h:.1f} mm / 72h)")
    elif rain_24h >= 60.0 or api_72h >= 90.0:
        score += 25
        factors.append(f"Heavy 24-72h rainfall accumulation ({rain_24h:.1f} mm / 24h, {rain_72h:.1f} mm / 72h)")
    elif rain_24h >= 30.0 or api_72h >= 45.0:
        score += 15
        factors.append(f"Elevated antecedent rainfall ({rain_24h:.1f} mm / 24h)")
    elif rain_24h > 10.0:
        score += 5

    # 3. Forecast Rainfall (Next 24h) - 0 to 20 points
    if forecast_24h >= 80.0:
        score += 20
        factors.append(f"High forecast precipitation in next 24h ({forecast_24h:.1f} mm)")
    elif forecast_24h >= 40.0:
        score += 12
        factors.append(f"Moderate forecast precipitation in next 24h ({forecast_24h:.1f} mm)")
    elif forecast_24h >= 15.0:
        score += 5

    # 4. Soil Moisture / Saturation - 0 to 10 points
    if soil_moisture >= 0.45:
        score += 10
        factors.append(f"High soil moisture saturation ({soil_moisture * 100:.1f}%)")
    elif soil_moisture >= 0.35:
        score += 5

    # 5. Historical Landslide Density Exposure - 0 to 10 points
    if historical_landslide_events >= 150:
        score += 10
        factors.append(f"High historical landslide density ({historical_landslide_events} recorded events)")
    elif historical_landslide_events >= 75:
        score += 5

    # Normalization to 0-100 scale
    score = min(100.0, max(0.0, score))

    if score >= 75:
        level = "CRITICAL"
    elif score >= 60:
        level = "VERY HIGH"
    elif score >= 42:
        level = "HIGH"
    elif score >= 25:
        level = "MODERATE"
    else:
        level = "LOW"
        if not factors:
            factors.append("Slope and precipitation indices remain within stable limits")

    return score, level, factors
