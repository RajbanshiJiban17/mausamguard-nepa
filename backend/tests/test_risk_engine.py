import pytest
from app.risk_engine.flood_model import calculate_flood_risk
from app.risk_engine.landslide_model import calculate_landslide_risk
from app.risk_engine.agriculture_model import calculate_agriculture_risk
from app.risk_engine.calculator import calculate_district_risk

def test_flood_risk_dhm_warning_triggered():
    # 1h rain >= 60mm triggers DHM warning threshold
    score, level, factors = calculate_flood_risk(
        rain_1h=65.0,
        rain_3h=70.0,
        rain_6h=80.0,
        rain_12h=90.0,
        rain_24h=110.0,
        forecast_24h=40.0,
        historical_flood_events=50
    )
    assert score >= 45.0
    assert level in ["HIGH", "VERY HIGH", "CRITICAL"]
    assert any("DHM warning reference" in f for f in factors)

def test_flood_risk_baseline_low():
    score, level, factors = calculate_flood_risk(
        rain_1h=1.0,
        rain_3h=2.0,
        rain_6h=4.0,
        rain_12h=6.0,
        rain_24h=8.0,
        forecast_24h=5.0,
        historical_flood_events=5
    )
    assert score < 25.0
    assert level == "LOW"

def test_landslide_risk_steep_slope_and_antecedent_saturation():
    score, level, factors = calculate_landslide_risk(
        rain_24h=85.0,
        rain_48h=140.0,
        rain_72h=180.0,
        forecast_24h=60.0,
        historical_landslide_events=120,
        slope_deg=34.0,
        elev_m=1800.0,
        soil_moisture=0.48
    )
    assert score >= 60.0
    assert level in ["VERY HIGH", "CRITICAL"]
    assert any("Steep slope" in f for f in factors)

def test_agriculture_risk_guidance():
    agri = calculate_agriculture_risk(
        rain_24h=110.0,
        forecast_24h=80.0,
        flood_risk_level="HIGH",
        landslide_risk_level="HIGH",
        temperature_c=24.0,
        soil_moisture=0.46
    )
    assert agri["crop_risk_level"] in ["HIGH", "VERY HIGH"]
    assert agri["rainfall_stress_level"] == "SEVERE_EXCESS"
    assert agri["guidance_label"] == "General agriculture risk guidance"
    assert len(agri["suggested_actions"]) > 0

def test_master_calculator_district():
    calc = calculate_district_risk(
        district_name="Kaski",
        rain_24h=40.0,
        forecast_24h=25.0,
        historical_flood_count=117,
        historical_landslide_count=233,
        slope_deg=28.0
    )
    assert "overall_risk_level" in calc
    assert "flood_risk_score" in calc
    assert "landslide_risk_score" in calc
    assert "agriculture_risk_score" in calc
    assert len(calc["risk_factors"]) > 0
    assert "District Kaski overall risk" in calc["explanation"]
