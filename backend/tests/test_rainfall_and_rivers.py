import pytest

def test_rainfall_overview(client):
    res = client.get("/api/v1/rainfall")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "highest_24h_district" in data
    assert len(data["districts"]) == 77

def test_river_stations_no_fake_data(client):
    res = client.get("/api/v1/river-stations")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_stations" in data
    assert data["total_stations"] >= 8
    
    # Verify no fake numerical water levels are returned when live feed is unavailable (Requirement 10 & 75)
    for st in data["stations"]:
        assert st["warning_level_m"] > 0
        assert st["danger_level_m"] > st["warning_level_m"]
        assert "feed_status" in st
        assert st["current_water_level"] is None # Strictly None per no-fake-data rule

def test_data_sources_attribution(client):
    res = client.get("/api/v1/data-sources")
    assert res.status_code == 200
    sources = res.json()["data"]
    names = [s["name"] for s in sources]
    assert any("BIPAD" in n or "Hazard Explorer" in n for n in names)
    assert any("DHM" in n for n in names)
    assert any("Open-Meteo" in n for n in names)

def test_system_status_diagnostics(client):
    res = client.get("/api/v1/system-status")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["overall_status"] == "OPERATIONAL"
    assert len(data["components"]) > 5
