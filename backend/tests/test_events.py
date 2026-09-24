import pytest

def test_events_list_pagination(client):
    res = client.get("/api/v1/events?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) == 10
    assert data["pagination"]["total_records"] >= 13000
    assert data["pagination"]["has_next"] is True

def test_events_filter_by_hazard(client):
    res = client.get("/api/v1/events?hazard=flood&page_size=20")
    assert res.status_code == 200
    events = res.json()["data"]
    for ev in events:
        assert "flood" in ev["hazard_type"].lower()

def test_events_stats_summary(client):
    res = client.get("/api/v1/events/stats/summary")
    assert res.status_code == 200
    stats = res.json()["data"]
    assert stats["total_events"] >= 13000
    assert stats["total_deaths"] > 0
    assert "landslide" in stats["by_hazard"]
    assert "flood" in stats["by_hazard"]

def test_events_yearly_trends(client):
    res = client.get("/api/v1/events/stats/yearly")
    assert res.status_code == 200
    trends = res.json()["data"]
    assert len(trends) > 30 # covers from 1970s to 2026
    years = [t["year"] for t in trends]
    assert 2026 in years
    assert 1980 in years

def test_events_monthly_trends(client):
    res = client.get("/api/v1/events/stats/monthly")
    assert res.status_code == 200
    trends = res.json()["data"]
    assert len(trends) == 12 # 12 months
    # Monsoon months (July/August - months 7 and 8) should show elevated event counts
    m7 = next(t for t in trends if t["month"] == 7)
    m1 = next(t for t in trends if t["month"] == 1)
    assert m7["event_count"] > m1["event_count"]
