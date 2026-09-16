import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Info,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getNotificationPage,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/inAppNotificationApi";
import type { InAppNotification } from "../types/inAppNotification";

import "./NotificationsPage.css";

const PAGE_SIZE = 10;

const filters = [
  { label: "All", value: "" },
  { label: "Unread", value: "unread" },
  { label: "Incidents", value: "incident" },
  { label: "Recoveries", value: "recovery" },
  { label: "Anomalies", value: "anomaly" },
  { label: "Information", value: "info" },
];

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function NotificationIcon({
  type,
}: {
  type: string;
}) {
  if (type === "success" || type === "recovery") {
    return <CircleCheck size={21} />;
  }

  if (
    type === "incident" ||
    type === "danger" ||
    type === "error"
  ) {
    return <XCircle size={21} />;
  }

  if (type === "anomaly" || type === "warning") {
    return <TriangleAlert size={21} />;
  }

  return <Info size={21} />;
}

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<
    InAppNotification[]
  >([]);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getNotificationPage({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        unreadOnly: filter === "unread",
        notificationType:
          filter && filter !== "unread"
            ? filter
            : undefined,
      });

      setNotifications(response.items);
      setTotal(response.total);
      setUnreadCount(response.unread_count);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleRead(
    notification: InAppNotification,
  ) {
    if (notification.is_read) {
      openNotificationResource(notification);
      return;
    }

    try {
      const updatedNotification =
        await markNotificationAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? updatedNotification
            : item,
        ),
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1),
      );

      openNotificationResource(updatedNotification);
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Unable to update notification.",
      );
    }
  }

  function openNotificationResource(
    notification: InAppNotification,
  ) {
    if (
      notification.resource_type === "website" &&
      notification.resource_id
    ) {
      navigate(
        `/websites/${notification.resource_id}`,
      );
      return;
    }

    if (
      notification.resource_type === "incident" &&
      notification.resource_id
    ) {
      navigate(
        `/incidents?selected=${notification.resource_id}`,
      );
    }
  }

  async function handleMarkAll() {
    try {
      setMarkingAll(true);
      setError("");

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at:
            notification.read_at ??
            new Date().toISOString(),
        })),
      );

      setUnreadCount(0);

      if (filter === "unread") {
        await loadNotifications();
      }
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to mark notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function selectFilter(value: string) {
    setFilter(value);
    setPage(1);
  }

  return (
    <div className="notifications-page">
      <header className="notifications-page-header">
        <div>
          <p className="notifications-eyebrow">
            Monitoring alerts
          </p>
          <h1>Notifications</h1>
          <p>
            Review incidents, recoveries and AI anomaly
            alerts.
          </p>
        </div>

        <div className="notifications-header-actions">
          <button
            type="button"
            className="notifications-secondary-button"
            onClick={() => void loadNotifications()}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "notifications-spinner"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            className="notifications-primary-button"
            onClick={() => void handleMarkAll()}
            disabled={
              markingAll || unreadCount === 0
            }
          >
            {markingAll ? (
              <LoaderCircle
                className="notifications-spinner"
                size={17}
              />
            ) : (
              <CheckCheck size={17} />
            )}
            Mark all read
          </button>
        </div>
      </header>

      <section className="notifications-overview">
        <div className="notifications-overview-icon">
          <Bell size={22} />
        </div>

        <div>
          <span>Unread notifications</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="notifications-filter-list">
          {filters.map((item) => (
            <button
              type="button"
              key={item.value}
              className={
                filter === item.value
                  ? "notification-filter-active"
                  : ""
              }
              onClick={() =>
                selectFilter(item.value)
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="notifications-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadNotifications()}
          >
            Try again
          </button>
        </div>
      )}

      <section className="notifications-list-card">
        {!error && loading && (
          <div className="notifications-empty-state">
            <LoaderCircle
              className="notifications-spinner"
              size={30}
            />
            <p>Loading notifications...</p>
          </div>
        )}

        {!error &&
          !loading &&
          notifications.length === 0 && (
            <div className="notifications-empty-state">
              <Bell size={38} />
              <h2>No notifications found</h2>
              <p>
                There are no notifications matching this
                filter.
              </p>
            </div>
          )}

        {!error &&
          !loading &&
          notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={
                notification.is_read
                  ? "notifications-list-item"
                  : "notifications-list-item notifications-list-item-unread"
              }
              onClick={() =>
                void handleRead(notification)
              }
            >
              <div
                className={`notifications-item-icon notifications-item-${notification.notification_type}`}
              >
                <NotificationIcon
                  type={notification.notification_type}
                />
              </div>

              <div className="notifications-item-content">
                <div className="notifications-item-heading">
                  <div>
                    <h2>{notification.title}</h2>

                    <span>
                      {notification.notification_type}
                    </span>
                  </div>

                  <time
                    dateTime={notification.created_at}
                  >
                    {formatDate(
                      notification.created_at,
                    )}
                  </time>
                </div>

                <p>{notification.message}</p>
              </div>

              {!notification.is_read && (
                <span className="notifications-unread-dot" />
              )}
            </button>
          ))}

        {!error && total > 0 && (
          <footer className="notifications-pagination">
            <p>
              Page {page} of {totalPages} · {total} result
              {total === 1 ? "" : "s"}
            </p>

            <div>
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= totalPages || loading
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                  )
                }
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}