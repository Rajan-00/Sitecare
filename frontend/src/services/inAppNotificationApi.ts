import { getStoredToken } from "./authStorage";
import type {
  InAppNotification,
  InAppNotificationListResponse,
  NotificationMessageResponse,
  UnreadCountResponse,
} from "../types/inAppNotification";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

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