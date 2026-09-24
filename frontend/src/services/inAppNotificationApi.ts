import { getStoredToken } from "./authStorage";
import type {
  DeletedNotificationsResponse,
  InAppNotification,
  InAppNotificationListResponse,
  NotificationMessageResponse,
  UnreadCountResponse,
} from "../types/inAppNotification";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1";

async function notificationRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "Notification request failed.";

    try {
      const data = (await response.json()) as {
        detail?: string;
      };

      message = data.detail ?? message;
    } catch {
      message = `Request failed with status ${response.status}.`;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getInAppNotifications(
  limit = 8,
): Promise<InAppNotificationListResponse> {
  return notificationRequest<InAppNotificationListResponse>(
    `/notifications/in-app?limit=${limit}&offset=0`,
  );
}

export function getUnreadNotificationCount():
  Promise<UnreadCountResponse> {
  return notificationRequest<UnreadCountResponse>(
    "/notifications/in-app/unread-count",
  );
}

export function markNotificationAsRead(
  notificationId: number,
): Promise<InAppNotification> {
  return notificationRequest<InAppNotification>(
    `/notifications/in-app/${notificationId}/read`,
    {
      method: "PATCH",
    },
  );
}

export function markAllNotificationsAsRead():
  Promise<NotificationMessageResponse> {
  return notificationRequest<NotificationMessageResponse>(
    "/notifications/in-app/read-all",
    {
      method: "PATCH",
    },
  );
}

export function deleteReadNotifications(): Promise<DeletedNotificationsResponse> {
  return notificationRequest<DeletedNotificationsResponse>(
    "/notifications/in-app/read",
    { method: "DELETE" },
  );
}

export interface NotificationQuery {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  notificationType?: string;
}

export function getNotificationPage(
  query: NotificationQuery = {},
): Promise<InAppNotificationListResponse> {
  const parameters = new URLSearchParams();

  parameters.set("limit", String(query.limit ?? 10));
  parameters.set("offset", String(query.offset ?? 0));

  if (query.unreadOnly) {
    parameters.set("unread_only", "true");
  }

  if (query.notificationType) {
    parameters.set(
      "notification_type",
      query.notificationType,
    );
  }

  return notificationRequest<InAppNotificationListResponse>(
    `/notifications/in-app?${parameters.toString()}`,
  );
}
