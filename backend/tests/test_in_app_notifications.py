from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.in_app_notification import InAppNotification


def test_delete_read_notifications_preserves_unread_and_other_users(
    client: TestClient,
    database: Session,
) -> None:
    read = InAppNotification(
        user_id=999, title="Read", message="Viewed", is_read=True,
    )
    unread = InAppNotification(
        user_id=999, title="Unread", message="Keep", is_read=False,
    )
    other_user = InAppNotification(
        user_id=500, title="Someone else", message="Keep", is_read=True,
    )
    database.add_all((read, unread, other_user))
    database.commit()

    before = client.get("/api/v1/notifications/in-app").json()
    assert before["read_count"] == 1
    assert before["unread_count"] == 1

    result = client.delete("/api/v1/notifications/in-app/read")
    assert result.status_code == 200
    assert result.json() == {"deleted_count": 1}

    remaining = database.scalars(select(InAppNotification)).all()
    assert {notification.title for notification in remaining} == {"Unread", "Someone else"}

    after = client.get("/api/v1/notifications/in-app").json()
    assert after["total"] == 1
    assert after["read_count"] == 0
    assert after["unread_count"] == 1
    assert client.delete("/api/v1/notifications/in-app/read").json() == {"deleted_count": 0}
