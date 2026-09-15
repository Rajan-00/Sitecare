def register_and_login(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Account Test User",
            "email": "account@example.com",
            "password": "Password123!",
        },
    )

    assert register_response.status_code in (200, 201)

    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "account@example.com",
            "password": "Password123!",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}",
    }


def test_get_profile(unauthenticated_client):
    headers = register_and_login(unauthenticated_client)

    response = unauthenticated_client.get(
        "/api/v1/account/profile",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["email"] == "account@example.com"
    assert response.json()["full_name"] == "Account Test User"


def test_update_profile(unauthenticated_client):
    headers = register_and_login(unauthenticated_client)

    response = unauthenticated_client.patch(
        "/api/v1/account/profile",
        headers=headers,
        json={
            "full_name": "Updated User",
            "email": "updated-account@example.com",
        },
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated User"
    assert response.json()["email"] == "updated-account@example.com"


def test_change_password(unauthenticated_client):
    headers = register_and_login(unauthenticated_client)

    response = unauthenticated_client.post(
        "/api/v1/account/change-password",
        headers=headers,
        json={
            "current_password": "Password123!",
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully."

    login_response = unauthenticated_client.post(
        "/api/v1/auth/login",
        data={
            "username": "account@example.com",
            "password": "NewPassword123!",
        },
    )

    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_reject_incorrect_current_password(unauthenticated_client):
    headers = register_and_login(unauthenticated_client)

    response = unauthenticated_client.post(
        "/api/v1/account/change-password",
        headers=headers,
        json={
            "current_password": "IncorrectPassword!",
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect."


def test_account_routes_require_authentication(unauthenticated_client):
    response = unauthenticated_client.get("/api/v1/account/profile")

    assert response.status_code == 401
