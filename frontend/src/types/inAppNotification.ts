export interface InAppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  resource_type: string | null;
  resource_id: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface InAppNotificationListResponse {
  items: InAppNotification[];
  total: number;
  unread_count: number;
  read_count: number;
  limit: number;
  offset: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationMessageResponse {
  message: string;
}

export interface DeletedNotificationsResponse {
  deleted_count: number;
}
