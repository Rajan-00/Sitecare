from fastapi.testclient import TestClient


def test_create_website(client: TestClient) -> None:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Example Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["name"] == "Example Website"
    assert data["url"] == "https://example.com/"
    assert data["check_interval_minutes"] == 5
    assert data["is_active"] is True
    assert "created_at" in data


def test_list_websites(client: TestClient) -> None:
    client.post(
        "/api/v1/websites",
        json={
            "name": "First Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    client.post(
        "/api/v1/websites",
        json={
            "name": "Second Website",
            "url": "https://openai.com",
            "check_interval_minutes": 10,
        },
    )

    response = client.get("/api/v1/websites")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 2

    website_names = {website["name"] for website in data}

    assert "First Website" in website_names
    assert "Second Website" in website_names


def test_get_website_by_id(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/websites",
        json={
            "name": "SiteCare Test",
            "url": "https://sitecare.example.com",
            "check_interval_minutes": 15,
        },
    )

    assert create_response.status_code == 201

    website_id = create_response.json()["id"]

    response = client.get(f"/api/v1/websites/{website_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == website_id
    assert data["name"] == "SiteCare Test"
    assert data["url"] == "https://sitecare.example.com/"
    assert data["check_interval_minutes"] == 15
    assert data["is_active"] is True


def test_missing_website_returns_not_found(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/websites/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Website not found."


def test_duplicate_website_is_rejected(
    client: TestClient,
) -> None:
    payload = {
        "name": "Example Website",
        "url": "https://example.com",
        "check_interval_minutes": 5,
    }

    first_response = client.post(
        "/api/v1/websites",
        json=payload,
    )

    second_response = client.post(
        "/api/v1/websites",
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "A website with this URL already exists."


def test_invalid_website_url_is_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Invalid Website",
            "url": "this-is-not-a-valid-url",
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 422


def test_invalid_check_interval_is_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Invalid Interval",
            "url": "https://example.com",
            "check_interval_minutes": 0,
        },
    )

    assert response.status_code == 422
