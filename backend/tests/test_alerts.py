import pytest
from app.services.alert_service import generate_alert_fingerprint

def test_alert_fingerprint():
    fp1 = generate_alert_fingerprint("Kathmandu", "flood", "HIGH", "threshold_exceeded")
    fp2 = generate_alert_fingerprint("kathmandu", "flood", "high", "threshold_exceeded")
    assert fp1 == fp2

def test_get_active_alerts(client):
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "active_count" in data
    assert "alerts" in data

def test_alert_history(client):
    res = client.get("/api/v1/alerts/history?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "pagination" in data
