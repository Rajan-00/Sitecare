from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.website import Website


def test_update_website(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/websites",
        json={
            "name": "Original Name",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    website_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/websites/{website_id}",
        json={
            "name": "Updated Website",
            "check_interval_minutes": 15,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Updated Website"
    assert data["check_interval_minutes"] == 15
    assert data["url"] == "https://example.com/"


def test_disable_website(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/websites",
        json={
            "name": "Active Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    website_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/websites/{website_id}",
        json={"is_active": False},
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False

    check_response = client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    assert check_response.status_code == 409
    assert check_response.json()["detail"] == "Website monitoring is disabled."


def test_delete_website(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/websites",
        json={
            "name": "Delete Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    website_id = create_response.json()["id"]

    response = client.delete(f"/api/v1/websites/{website_id}")

    assert response.status_code == 204

    get_response = client.get(f"/api/v1/websites/{website_id}")

    assert get_response.status_code == 404


def test_empty_update_is_rejected(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/websites",
        json={
            "name": "Example Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    website_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/websites/{website_id}",
        json={},
    )

    assert response.status_code == 422

def test_created_website_has_owner(
    client: TestClient,
    database: Session,
) -> None:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Owned Website",
            "url": "https://owned.example.com",
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 201

    website = database.get(
        Website,
        response.json()["id"],
    )

    assert website is not None
    assert website.user_id == 999


def test_user_cannot_access_unowned_website(
    client: TestClient,
    database: Session,
) -> None:
    website = Website(
        user_id=500,
        name="Another User Website",
        url="https://private.example.com/",
        check_interval_minutes=5,
        is_active=True,
    )

    database.add(website)
    database.commit()
    database.refresh(website)

    response = client.get(f"/api/v1/websites/{website.id}")

    assert response.status_code == 404
