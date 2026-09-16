import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { StatusBadge } from "../components/StatusBadge";
import {
  getWebsiteMetrics,
  getWebsites,
} from "../services/api";
import type {
  Website,
  WebsiteMetric,
} from "../types/dashboard";

import "./WebsitesPage.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatResponseTime(
  value: number | null,
): string {
  if (value === null) {
    return "Not checked";
  }

  return `${Math.round(value)} ms`;
}

export function WebsitesPage() {
  const [websites, setWebsites] =
    useState<Website[]>([]);

  const [metrics, setMetrics] =
    useState<WebsiteMetric[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadWebsites = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          websiteData,
          metricData,
        ] = await Promise.all([
          getWebsites(),
          getWebsiteMetrics(),
        ]);

        setWebsites(websiteData);
        setMetrics(metricData);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load websites.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadWebsites();
  }, [loadWebsites]);

  const metricMap = useMemo(
    () =>
      new Map(
        metrics.map((metric) => [
          metric.website_id,
          metric,
        ]),
      ),
    [metrics],
  );

  const filteredWebsites = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return websites;
    }

    return websites.filter(
      (website) =>
        website.name.toLowerCase().includes(query) ||
        website.url.toLowerCase().includes(query),
    );
  }, [search, websites]);

  const activeCount = websites.filter(
    (website) => website.is_active,
  ).length;

  const operationalCount = metrics.filter(
    (metric) =>
      metric.current_status === "up",
  ).length;

  if (loading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />
        <p>Loading monitored websites...</p>
      </div>
    );
  }

  return (
    <div className="websites-page">
      <section className="websites-overview">
        <div>
          <div className="websites-status">
            <span />
            Monitoring workspace
          </div>

          <h2>
            Manage every monitored website
            from one place
          </h2>

          <p>
            Review availability, performance,
            monitoring intervals and current status.
          </p>
        </div>

        <Link
          className="primary-button"
          to="/websites/new"
        >
          <Plus size={17} />
          Add website
        </Link>
      </section>

      <section className="website-summary-grid">
        <article>
          <div className="website-summary-icon blue">
            <Globe2 size={20} />
          </div>

          <div>
            <span>Total websites</span>
            <strong>{websites.length}</strong>
          </div>
        </article>

        <article>
          <div className="website-summary-icon green">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Currently active</span>
            <strong>{activeCount}</strong>
          </div>
        </article>

        <article>
          <div className="website-summary-icon purple">
            <Activity size={20} />
          </div>

          <div>
            <span>Operational</span>
            <strong>{operationalCount}</strong>
          </div>
        </article>
      </section>

      <section className="websites-panel">
        <div className="websites-panel-header">
          <div>
            <h2>Monitored websites</h2>
            <p>
              {websites.length} website
              {websites.length === 1 ? "" : "s"} in
              your workspace
            </p>
          </div>

          <div className="websites-toolbar">
            <label className="website-search">
              <Search size={17} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search websites..."
              />
            </label>

            <button
              type="button"
              className="secondary-button"
              disabled={refreshing}
              onClick={() =>
                void loadWebsites(true)
              }
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "spin-animation"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="websites-error">
            <TriangleAlert size={22} />

            <div>
              <strong>
                Unable to load websites
              </strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadWebsites()
              }
            >
              Try again
            </button>
          </div>
        )}

        {!error &&
          filteredWebsites.length === 0 && (
            <div className="websites-empty">
              <Globe2 size={42} />

              <h3>
                {websites.length === 0
                  ? "No websites added"
                  : "No matching websites"}
              </h3>

              <p>
                {websites.length === 0
                  ? "Add your first website to start monitoring uptime and performance."
                  : "Try a different search term."}
              </p>

              {websites.length === 0 && (
                <Link
                  className="primary-button"
                  to="/websites/new"
                >
                  <Plus size={17} />
                  Add first website
                </Link>
              )}
            </div>
          )}

        {!error &&
          filteredWebsites.length > 0 && (
            <div className="websites-table-wrapper">
              <table className="websites-table">
                <thead>
                  <tr>
                    <th>Website</th>
                    <th>Status</th>
                    <th>Monitoring</th>
                    <th>Response</th>
                    <th>Uptime</th>
                    <th>Added</th>
                    <th>
                      <span className="sr-only">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWebsites.map(
                    (website) => {
                      const metric =
                        metricMap.get(website.id);

                      return (
                        <tr key={website.id}>
                          <td>
                            <div className="website-cell">
                              <div className="website-cell-icon">
                                <Globe2 size={19} />
                              </div>

                              <div>
                                <Link
                                  to={`/websites/${website.id}`}
                                >
                                  {website.name}
                                </Link>

                                <a
                                  href={website.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {website.url}
                                  <ExternalLink
                                    size={12}
                                  />
                                </a>
                              </div>
                            </div>
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                metric?.current_status ??
                                "not_checked"
                              }
                            />
                          </td>

                          <td>
                            <span
                              className={
                                website.is_active
                                  ? "monitoring-state active"
                                  : "monitoring-state paused"
                              }
                            >
                              <span />
                              {website.is_active
                                ? "Active"
                                : "Paused"}
                            </span>

                            <small>
                              Every{" "}
                              {
                                website.check_interval_minutes
                              }{" "}
                              minutes
                            </small>
                          </td>

                          <td>
                            {formatResponseTime(
                              metric
                                ?.average_response_time_ms ??
                                null,
                            )}
                          </td>

                          <td>
                            <strong>
                              {metric
                                ? `${metric.uptime_percentage}%`
                                : "—"}
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              website.created_at,
                            )}
                          </td>

                          <td>
                            <div className="website-row-actions">
                              <Link
                                title="View website"
                                to={`/websites/${website.id}`}
                              >
                                View
                              </Link>

                              <Link
                                title="Edit website"
                                to={`/websites/${website.id}/edit`}
                              >
                                <Pencil size={15} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}