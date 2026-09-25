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

def test_change_password(client):
    unique_suffix = str(uuid.uuid4())[:8]
    username = f"pw_user_{unique_suffix}"
    email = f"pw_{unique_suffix}@example.com"
    old_pw = "OriginalPass123!"
    new_pw = "NewSuperSecurePass2026!"

    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "username": username,
        "email": email,
        "full_name": "Password Test User",
        "password": old_pw
    })
    assert reg_res.status_code == 200

    # 2. Login to get token
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": username,
        "password": old_pw
    })
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Fail with wrong current password
    fail_res1 = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "WrongCurrentPassword!",
        "new_password": new_pw
    })
    assert fail_res1.status_code == 400

    # 4. Fail with too short new password
    fail_res2 = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": old_pw,
        "new_password": "short"
    })
    assert fail_res2.status_code == 400

    # 5. Successfully update password
    succ_res = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": old_pw,
        "new_password": new_pw
    })
    assert succ_res.status_code == 200
    assert succ_res.json()["success"] is True

    # 6. Verify old password no longer works
    old_login = client.post("/api/v1/auth/login", json={
        "username_or_email": username,
        "password": old_pw
    })
    assert old_login.status_code == 401

    # 7. Verify new password works
    new_login = client.post("/api/v1/auth/login", json={
        "username_or_email": username,
        "password": new_pw
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()["data"]
