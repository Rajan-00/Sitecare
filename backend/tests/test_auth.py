from fastapi.testclient import TestClient


def register_user(
    client: TestClient,
) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Rajan Rawal",
            "email": "rajan@example.com",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 201

    return response.json()


def login_user(
    client: TestClient,
) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "rajan@example.com",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_register_user(
    unauthenticated_client: TestClient,
) -> None:
    data = register_user(unauthenticated_client)

    assert data["full_name"] == "Rajan Rawal"
    assert data["email"] == "rajan@example.com"
    assert data["is_active"] is True
    assert "hashed_password" not in data
    assert "password" not in data


def test_duplicate_email_is_rejected(
    unauthenticated_client: TestClient,
) -> None:
    register_user(unauthenticated_client)

    response = unauthenticated_client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Another User",
            "email": "rajan@example.com",
            "password": "AnotherPassword123!",
        },
    )

    assert response.status_code == 409


def test_login_returns_access_token(
    unauthenticated_client: TestClient,
) -> None:
    register_user(unauthenticated_client)

    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        data={
            "username": "rajan@example.com",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["expires_in"] > 0
    assert data["user"]["email"] == "rajan@example.com"


def test_invalid_password_is_rejected(
    unauthenticated_client: TestClient,
) -> None:
    register_user(unauthenticated_client)

    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        data={
            "username": "rajan@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_get_current_user(
    unauthenticated_client: TestClient,
) -> None:
    register_user(unauthenticated_client)

    access_token = login_user(unauthenticated_client)

    response = unauthenticated_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": (f"Bearer {access_token}")},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "rajan@example.com"


def test_me_requires_token(
    unauthenticated_client: TestClient,
) -> None:
    response = unauthenticated_client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_protected_endpoint_requires_token(
    unauthenticated_client: TestClient,
) -> None:
    response = unauthenticated_client.get("/api/v1/dashboard/summary")

    assert response.status_code == 401


def test_protected_endpoint_accepts_token(
    unauthenticated_client: TestClient,
) -> None:
    register_user(unauthenticated_client)

    access_token = login_user(unauthenticated_client)

    response = unauthenticated_client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": (f"Bearer {access_token}")},
    )

    assert response.status_code == 200
