import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileClock,
  KeyRound,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { getAuditLogs } from "../services/auditLogApi";
import type { AuditLog } from "../types/auditLog";

import "./ActivityPage.css";

const PAGE_SIZE = 10;

interface ActionOption {
  label: string;
  value: string;
}

const actionOptions: ActionOption[] = [
  {
    label: "All activities",
    value: "",
  },
  {
    label: "Profile updates",
    value: "profile.updated",
  },
  {
    label: "Password changes",
    value: "password.changed",
  },
];

function getActivityIcon(action: string) {
  if (action === "profile.updated") {
    return <UserRound size={19} />;
  }

  if (action === "password.changed") {
    return <KeyRound size={19} />;
  }

  return <FileClock size={19} />;
}

function getActivityLabel(action: string): string {
  if (action === "profile.updated") {
    return "Profile updated";
  }

  if (action === "password.changed") {
    return "Password changed";
  }

  if (action === "website.created") {
    return "Website added";
  }

  if (action === "website.updated") {
    return "Website updated";
  }

  if (action === "website.deleted") {
    return "Website deleted";
  }

  if (action === "monitoring.check_started") {
    return "Health check started";
  }

  return action
    .split(".")
    .join(" ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function formatRelativeTime(dateValue: string): string {
  const date = new Date(dateValue);
  const difference = Date.now() - date.getTime();

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return formatDate(dateValue);
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedAction, setSelectedAction] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        action: selectedAction || undefined,
      });

      setActivities(data.items);
      setTotal(data.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load activity history.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, selectedAction]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  function handleFilterChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setSelectedAction(event.target.value);
    setPage(1);
  }

  return (
    <div className="activity-page">
      <div className="activity-page-header">
        <div>
          <p className="activity-eyebrow">
            Security and account history
          </p>

          <h1>Activity Log</h1>

          <p>
            Review important actions performed on your
            SiteCare account.
          </p>
        </div>

        <button
          type="button"
          className="activity-refresh-button"
          onClick={() => void loadActivities()}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "activity-refresh-spinning" : ""
            }
          />

          Refresh
        </button>
      </div>

      <section className="activity-summary">
        <div className="activity-summary-icon">
          <Clock3 size={22} />
        </div>

        <div>
          <span>Total recorded activities</span>
          <strong>{total}</strong>
        </div>

        <div className="activity-filter">
          <label htmlFor="activity-action">
            Filter activity
          </label>

          <select
            id="activity-action"
            value={selectedAction}
            onChange={handleFilterChange}
          >
            {actionOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="activity-card">
        {error && (
          <div className="activity-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadActivities()}
            >
              Try again
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="activity-loading">
            <div className="activity-loading-spinner" />
            <p>Loading your activity history...</p>
          </div>
        )}

        {!error &&
          !loading &&
          activities.length === 0 && (
            <div className="activity-empty">
              <FileClock size={36} />

              <h2>No activity recorded</h2>

              <p>
                Your important account actions will appear
                here.
              </p>
            </div>
          )}

        {!error &&
          !loading &&
          activities.length > 0 && (
            <div className="activity-timeline">
              {activities.map((activity) => (
                <article
                  className="activity-item"
                  key={activity.id}
                >
                  <div className="activity-item-line">
                    <div className="activity-item-icon">
                      {getActivityIcon(activity.action)}
                    </div>
                  </div>

                  <div className="activity-item-content">
                    <div className="activity-item-heading">
                      <div>
                        <h2>
                          {getActivityLabel(activity.action)}
                        </h2>

                        <span className="activity-action-code">
                          {activity.action}
                        </span>
                      </div>

                      <time
                        dateTime={activity.created_at}
                        title={formatDate(
                          activity.created_at,
                        )}
                      >
                        {formatRelativeTime(
                          activity.created_at,
                        )}
                      </time>
                    </div>

                    <p>{activity.description}</p>

                    <div className="activity-item-meta">
                      <span>
                        {formatDate(activity.created_at)}
                      </span>

                      {activity.resource_type && (
                        <span>
                          Resource:{" "}
                          {activity.resource_type}
                          {activity.resource_id
                            ? ` #${activity.resource_id}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        {!error && total > 0 && (
          <div className="activity-pagination">
            <p>
              Page {page} of {totalPages}
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                disabled={page === 1 || loading}
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1),
                  )
                }
                disabled={
                  page >= totalPages || loading
                }
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}