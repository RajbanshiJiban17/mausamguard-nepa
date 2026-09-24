import pytest

def test_list_all_77_districts(client):
    res = client.get("/api/v1/districts")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    districts = data["data"]
    assert len(districts) == 77
    
    # Check Taplejung and Kathmandu exist
    names = [d["district_name"] for d in districts]
    assert "Taplejung" in names
    assert "Kathmandu" in names

def test_filter_districts_by_province(client):
    res = client.get("/api/v1/districts?province=Bagmati")
    assert res.status_code == 200
    districts = res.json()["data"]
    assert len(districts) == 13 # Bagmati has exactly 13 districts
    for d in districts:
        assert d["province"] == "Bagmati"

def test_district_geojson(client):
    res = client.get("/api/v1/districts/geojson")
    assert res.status_code == 200
    fc = res.json()["data"]
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 77
    assert "overall_risk" in fc["features"][0]["properties"]

def test_district_detail(client):
    res = client.get("/api/v1/districts/Kathmandu")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["district_name"] == "Kathmandu"
    assert data["province"] == "Bagmati"
    assert "hazard_breakdown" in data
    assert "current_overall_risk" in data

def test_compare_districts(client):
    res = client.get("/api/v1/districts/compare?ids=Kathmandu,Rasuwa")
    assert res.status_code == 200
    districts = res.json()["data"]["districts"]
    assert len(districts) == 2
    names = [d["district_name"] for d in districts]
    assert "Kathmandu" in names
    assert "Rasuwa" in names
