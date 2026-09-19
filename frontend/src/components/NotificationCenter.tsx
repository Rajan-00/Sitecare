import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  CheckCheck,
  CircleCheck,
  Info,
  LoaderCircle,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getInAppNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/inAppNotificationApi";
import type { InAppNotification } from "../types/inAppNotification";

import "./NotificationCenter.css";


function formatRelativeTime(dateValue: string): string {
  const difference =
    Date.now() - new Date(dateValue).getTime();

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(dateValue).toLocaleDateString();
}

function NotificationIcon({
  type,
}: {
  type: string;
}) {
  if (type === "success" || type === "recovery") {
    return <CircleCheck size={18} />;
  }

  if (
    type === "danger" ||
    type === "error" ||
    type === "incident"
  ) {
    return <XCircle size={18} />;
  }

  if (type === "warning" || type === "anomaly") {
    return <TriangleAlert size={18} />;
  }

  return <Info size={18} />;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    InAppNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const loadUnreadCount = useCallback(async () => {
    try {
      const response =
        await getUnreadNotificationCount();

      setUnreadCount(response.unread_count);
    } catch {
      // Do not interrupt the whole layout if this fails.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getInAppNotifications(8);

      setNotifications(response.items);
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
  }, []);

  useEffect(() => {
    void loadUnreadCount();

    const intervalId = window.setInterval(() => {
      void loadUnreadCount();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open, loadNotifications]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  async function handleNotificationClick(
    notification: InAppNotification,
  ) {
    try {
      if (!notification.is_read) {
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
      }
    } catch {
      // Navigation can continue if marking as read fails.
    }

    setOpen(false);

    if (
  notification.resource_type === "incident" &&
  notification.resource_id
) {
  navigate(
    `/incidents?selected=${notification.resource_id}`,
  );
  return;
}

    if (
      notification.resource_type === "website" &&
      notification.resource_id
    ) {
      navigate(
        `/websites/${notification.resource_id}`,
      );
      return;
    }

    if (notification.resource_type === "incident") {
      navigate("/incidents");
      return;
    }

    navigate("/notifications");
  }

  async function handleMarkAllAsRead() {
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
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to update notifications.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div
      className="notification-center"
      ref={containerRef}
    >
      <button
        type="button"
        className={
          open
            ? "notification-trigger notification-trigger-active"
            : "notification-trigger"
        }
        aria-label="Open notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h2>Notifications</h2>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "You are all caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={() =>
                  void handleMarkAllAsRead()
                }
                disabled={markingAll}
              >
                {markingAll ? (
                  <LoaderCircle
                    className="notification-spinner"
                    size={15}
                  />
                ) : (
                  <CheckCheck size={15} />
                )}

                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loading && (
              <div className="notification-state">
                <LoaderCircle
                  className="notification-spinner"
                  size={25}
                />
                <p>Loading notifications...</p>
              </div>
            )}

            {!loading && error && (
              <div className="notification-state notification-error">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() =>
                    void loadNotifications()
                  }
                >
                  Try again
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              notifications.length === 0 && (
                <div className="notification-state">
                  <Bell size={30} />
                  <strong>No notifications</strong>
                  <p>New monitoring alerts will appear here.</p>
                </div>
              )}

            {!loading &&
              !error &&
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={
                    notification.is_read
                      ? "notification-item"
                      : "notification-item notification-item-unread"
                  }
                  onClick={() =>
                    void handleNotificationClick(
                      notification,
                    )
                  }
                >
                  <div
                    className={`notification-type-icon notification-type-${notification.notification_type}`}
                  >
                    <NotificationIcon
                      type={
                        notification.notification_type
                      }
                    />
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-title">
                      <strong>{notification.title}</strong>

                      {!notification.is_read && (
                        <span className="notification-unread-dot" />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <time
                      dateTime={notification.created_at}
                    >
                      {formatRelativeTime(
                        notification.created_at,
                      )}
                    </time>
                  </div>
                </button>
              ))}
          </div>

          <div className="notification-dropdown-footer">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}