from fastapi.testclient import TestClient


def test_get_default_notification_settings(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/notifications/settings")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == 1
    assert data["is_enabled"] is True
    assert data["notify_on_downtime"] is True
    assert data["notify_on_recovery"] is True
    assert data["notify_on_anomaly"] is True


def test_update_notification_settings(
    client: TestClient,
) -> None:
    response = client.put(
        "/api/v1/notifications/settings",
        json={
            "email_address": "rajan@example.com",
            "is_enabled": True,
            "notify_on_downtime": True,
            "notify_on_recovery": False,
            "notify_on_anomaly": True,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email_address"] == "rajan@example.com"
    assert data["notify_on_recovery"] is False


def test_invalid_notification_email(
    client: TestClient,
) -> None:
    response = client.put(
        "/api/v1/notifications/settings",
        json={
            "email_address": "invalid-email",
            "is_enabled": True,
            "notify_on_downtime": True,
            "notify_on_recovery": True,
            "notify_on_anomaly": True,
        },
    )

    assert response.status_code == 422
