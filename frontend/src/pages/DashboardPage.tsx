import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  Clock3,
  Globe2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Wifi,
} from "lucide-react";
import { Link } from "react-router-dom";

import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  getDashboardSummary,
  getWebsiteMetrics,
} from "../services/api";
import type {
  DashboardSummary,
  WebsiteMetric,
} from "../types/dashboard";

import "./DashboardPage.css";

function formatResponseTime(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value)} ms`;
}

function formatLastChecked(
  value: string | null,
): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getHealthClass(score: number): string {
  if (score >= 90) {
    return "health-score--excellent";
  }

  if (score >= 70) {
    return "health-score--good";
  }

  return "health-score--poor";
}

export function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [websites, setWebsites] =
    useState<WebsiteMetric[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const [summaryData, websiteData] =
          await Promise.all([
            getDashboardSummary(),
            getWebsiteMetrics(),
          ]);

        setSummary(summaryData);
        setWebsites(websiteData);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load dashboard data.";

        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="page-state">
        <RefreshCw
          className="spin-animation"
          size={28}
        />

        <p>Loading website health data...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="page-state page-state--error">
        <ShieldAlert size={32} />

        <div>
          <h2>Dashboard unavailable</h2>

          <p>
            {error ??
              "The dashboard response was empty."}
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => void loadDashboard()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="dashboard-intro">
        <div>
          <div className="live-indicator">
            <span />
            Live monitoring active
          </div>

          <p>
            Monitor uptime, performance, incidents, and
            website health from one workspace.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={isRefreshing}
            onClick={() => void loadDashboard(true)}
          >
            <RefreshCw
              className={
                isRefreshing
                  ? "spin-animation"
                  : ""
              }
              size={17}
            />

            {isRefreshing
              ? "Refreshing"
              : "Refresh data"}
          </button>

          <Link
            className="primary-button"
            to="/websites/new"
          >
            <Plus size={17} />
            Add website
          </Link>
        </div>
      </section>

      <section className="statistics-grid">
        <StatCard
          title="Total websites"
          value={String(summary.total_websites)}
          description={
            `${summary.active_websites} currently active`
          }
          icon={<Globe2 size={22} />}
          tone="blue"
        />

        <StatCard
          title="Operational"
          value={String(summary.websites_up)}
          description={
            `${summary.overall_uptime_percentage}% overall uptime`
          }
          icon={<Wifi size={22} />}
          tone="green"
        />

        <StatCard
          title="Incidents"
          value={String(summary.total_incidents)}
          description={
            `${summary.websites_down} currently down`
          }
          icon={<ShieldAlert size={22} />}
          tone="red"
        />

        <StatCard
          title="Average response"
          value={formatResponseTime(
            summary.average_response_time_ms,
          )}
          description={
            `${summary.total_checks} checks completed`
          }
          icon={<Clock3 size={22} />}
          tone="purple"
        />
      </section>

      <section
        className="dashboard-panel"
        id="websites"
      >
        <div className="panel-heading">
          <div>
            <div className="panel-heading__title">
              <Activity size={20} />

              <h2>Website health</h2>
            </div>

            <p>
              Current operational status and historical
              performance.
            </p>
          </div>

          <span className="record-count">
            {websites.length}{" "}
            {websites.length === 1
              ? "website"
              : "websites"}
          </span>
        </div>

        {websites.length === 0 ? (
          <div className="empty-state">
            <Globe2 size={36} />

            <h3>No websites registered</h3>

            <p>
              Add your first website to begin uptime
              and performance monitoring.
            </p>

            <Link
              className="primary-button empty-state__button"
              to="/websites/new"
            >
              <Plus size={17} />
              Add first website
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="website-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Uptime</th>
                  <th>Response</th>
                  <th>Checks</th>
                  <th>Last checked</th>
                </tr>
              </thead>

              <tbody>
                {websites.map((website) => (
                  <tr key={website.website_id}>
                    <td>
                      <div className="website-identity">
                        <div className="website-icon">
                          <Globe2 size={18} />
                        </div>

                        <div>
                          <Link
                            className="website-name-link"
                            to={
                              `/websites/${website.website_id}`
                            }
                          >
                            {website.website_name}
                          </Link>

                          <a
                            href={website.website_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {website.website_url}
                          </a>
                        </div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          website.current_status
                        }
                      />
                    </td>

                    <td>
                      <div className="health-score">
                        <div className="health-score__track">
                          <span
                            className={getHealthClass(
                              website.health_score,
                            )}
                            style={{
                              width: `${Math.min(
                                website.health_score,
                                100,
                              )}%`,
                            }}
                          />
                        </div>

                        <strong>
                          {website.health_score}%
                        </strong>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {website.uptime_percentage}%
                      </strong>
                    </td>

                    <td>
                      {formatResponseTime(
                        website.average_response_time_ms,
                      )}
                    </td>

                    <td>{website.total_checks}</td>

                    <td>
                      {formatLastChecked(
                        website.last_checked_at,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}