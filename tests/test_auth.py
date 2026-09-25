from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_register_and_login_flow():
    email = "newstudent@mergington.edu"
    password = "supersecret123"

    register_response = client.post(
        "/register",
        json={
            "first_name": "Ava",
            "last_name": "Student",
            "email": email,
            "password": password,
        },
    )
    assert register_response.status_code == 200
    assert register_response.json()["user"]["email"] == email

    login_response = client.post(
        "/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == email

    me_response = client.get("/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


def test_duplicate_email_and_invalid_login_are_rejected():
    email = "duplicate@mergington.edu"
    password = "password123"

    first_registration = client.post(
        "/register",
        json={
            "first_name": "Sam",
            "last_name": "Learner",
            "email": email,
            "password": password,
        },
    )
    assert first_registration.status_code == 200

    duplicate_registration = client.post(
        "/register",
        json={
            "first_name": "Sam",
            "last_name": "Another",
            "email": email,
            "password": password,
        },
    )
    assert duplicate_registration.status_code == 400

    invalid_login = client.post(
        "/login",
        json={
            "email": email,
            "password": "wrongpassword",
        },
    )
    assert invalid_login.status_code == 401
