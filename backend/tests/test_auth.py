import pytest
from app.config import settings

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "TeachMate"

def test_register_teacher_success(client):
    payload = {
        "email": "teacher1@example.com",
        "password": "securepassword123",
        "display_name": "Prof. Sharma",
        "role": "teacher",
        "timezone": "Asia/Kolkata"
    }
    response = client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "user" in data
    assert data["user"]["email"] == "teacher1@example.com"
    assert data["user"]["display_name"] == "Prof. Sharma"
    assert data["user"]["role"] == "teacher"
    # Ensure cookie was set
    assert settings.COOKIE_NAME in response.cookies

def test_register_duplicate_email_fails(client):
    payload = {
        "email": "dup@example.com",
        "password": "securepassword123",
        "display_name": "Teacher Dup",
        "role": "teacher"
    }
    res1 = client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert res2.status_code == 400
    error_data = res2.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "EMAIL_ALREADY_EXISTS"

def test_register_validation_error_format(client):
    payload = {
        "email": "bademail",
        "password": "123",  # too short
        "display_name": "A",
        "role": "invalid_role"
    }
    response = client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "validation_errors" in data["error"]["details"]

def test_login_success_and_logout(client):
    # Register first
    reg_payload = {
        "email": "loginuser@example.com",
        "password": "mypassword123",
        "display_name": "Login User",
        "role": "student"
    }
    client.post(f"{settings.API_V1_STR}/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "loginuser@example.com",
        "password": "mypassword123"
    }
    login_res = client.post(f"{settings.API_V1_STR}/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "student"
    assert settings.COOKIE_NAME in login_res.cookies

    # Access /auth/me with cookie
    me_res = client.get(f"{settings.API_V1_STR}/auth/me", cookies=login_res.cookies)
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "loginuser@example.com"

    # Logout
    logout_res = client.post(f"{settings.API_V1_STR}/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json() == {"ok": True}

def test_login_invalid_password(client):
    reg_payload = {
        "email": "wrongpass@example.com",
        "password": "correctpassword",
        "display_name": "User",
        "role": "teacher"
    }
    client.post(f"{settings.API_V1_STR}/auth/register", json=reg_payload)

    login_res = client.post(f"{settings.API_V1_STR}/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "wrongpassword"
    })
    assert login_res.status_code == 401
    assert login_res.json()["error"]["code"] == "INVALID_CREDENTIALS"

def test_me_unauthenticated(client):
    res = client.get(f"{settings.API_V1_STR}/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHENTICATED"
