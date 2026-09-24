import uuid
import pytest

def test_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "MausamGuardAdmin2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["username"] == "admin"

def test_login_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401
    data = res.json()
    assert data["success"] is False

def test_register_and_me(client):
    unique_suffix = str(uuid.uuid4())[:8]
    username = f"user_{unique_suffix}"
    email = f"user_{unique_suffix}@example.com"
    
    # Register
    res = client.post("/api/v1/auth/register", json={
        "username": username,
        "email": email,
        "full_name": "Test User",
        "password": "SecurePassword2026!"
    })
    assert res.status_code == 200
    reg_data = res.json()
    assert reg_data["success"] is True
    assert reg_data["data"]["username"] == username

    # Login with new user
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": username,
        "password": "SecurePassword2026!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]

    # Access /me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["data"]["username"] == username
