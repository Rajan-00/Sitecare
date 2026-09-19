import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Siren,
  TriangleAlert,
} from "lucide-react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { getIncidents } from "../services/api";
import type { Incident } from "../types/dashboard";

import "./IncidentsPage.css";

type IncidentFilter =
  | "all"
  | "open"
  | "resolved";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(
  seconds: number | null,
): string {
  if (seconds === null) {
    return "Ongoing";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }

  return `${(seconds / 3600).toFixed(1)} hr`;
}

export function IncidentsPage() {
  const [searchParams] = useSearchParams();

  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [filter, setFilter] =
    useState<IncidentFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const selectedIncidentId = Number(
    searchParams.get("selected"),
  );

  const loadIncidents = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        setIncidents(await getIncidents());
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load incidents.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const openIncidents = incidents.filter(
    (incident) => !incident.is_resolved,
  ).length;

  const resolvedIncidents = incidents.filter(
    (incident) => incident.is_resolved,
  ).length;

  const criticalIncidents = incidents.filter(
    (incident) =>
      incident.severity.toLowerCase() ===
      "critical",
  ).length;

  const visibleIncidents = useMemo(() => {
    if (filter === "open") {
      return incidents.filter(
        (incident) => !incident.is_resolved,
      );
    }

    if (filter === "resolved") {
      return incidents.filter(
        (incident) => incident.is_resolved,
      );
    }

    return incidents;
  }, [filter, incidents]);

  if (isLoading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />
        <p>Loading incidents...</p>
      </div>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <div className="page-state page-state--error">
        <ShieldAlert size={34} />

        <h2>Incidents unavailable</h2>

        <p>{error}</p>

        <button
          className="primary-button"
          type="button"
          onClick={() => void loadIncidents()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="incidents-page">
      <div className="incidents-toolbar">
        <div>
          <span
            className={
              openIncidents > 0
                ? "incidents-health incidents-health-warning"
                : "incidents-health"
            }
          >
            <span />

            {openIncidents > 0
              ? `${openIncidents} active incident${
                  openIncidents === 1 ? "" : "s"
                }`
              : "All monitored websites operational"}
          </span>

          <p>
            Review website downtime, recovery events and
            recorded failures.
          </p>
        </div>

        <button
          type="button"
          className="incidents-refresh-button"
          disabled={isRefreshing}
          onClick={() => void loadIncidents(true)}
        >
          <RefreshCw
            size={16}
            className={
              isRefreshing
                ? "incidents-refresh-spinning"
                : ""
            }
          />

          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="incidents-inline-error">
          {error}
        </div>
      )}

      <section className="incidents-statistics">
        <article className="incident-stat-card">
          <span className="incident-stat-icon incident-stat-blue">
            <Siren size={19} />
          </span>

          <div>
            <span>Total incidents</span>
            <strong>{incidents.length}</strong>
          </div>
        </article>

        <article className="incident-stat-card">
          <span className="incident-stat-icon incident-stat-red">
            <TriangleAlert size={19} />
          </span>

          <div>
            <span>Currently open</span>
            <strong>{openIncidents}</strong>
          </div>
        </article>

        <article className="incident-stat-card">
          <span className="incident-stat-icon incident-stat-green">
            <CheckCircle2 size={19} />
          </span>

          <div>
            <span>Resolved</span>
            <strong>{resolvedIncidents}</strong>
          </div>
        </article>

        <article className="incident-stat-card">
          <span className="incident-stat-icon incident-stat-orange">
            <ShieldAlert size={19} />
          </span>

          <div>
            <span>Critical severity</span>
            <strong>{criticalIncidents}</strong>
          </div>
        </article>
      </section>

      <section className="incidents-panel">
        <div className="incidents-panel-heading">
          <div>
            <h2>Incident history</h2>

            <p>
              Service failures and recorded recoveries.
            </p>
          </div>

          <div className="incidents-panel-controls">
            <label htmlFor="incident-filter">
              Status
            </label>

            <select
              id="incident-filter"
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as IncidentFilter,
                )
              }
            >
              <option value="all">
                All incidents
              </option>

              <option value="open">
                Open incidents
              </option>

              <option value="resolved">
                Resolved incidents
              </option>
            </select>

            <span className="incidents-record-count">
              {visibleIncidents.length} result
              {visibleIncidents.length === 1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        {visibleIncidents.length === 0 ? (
          <div className="incidents-empty-state">
            <CheckCircle2 size={36} />

            <h3>
              {filter === "all"
                ? "No incidents recorded"
                : `No ${filter} incidents`}
            </h3>

            <p>
              {filter === "all"
                ? "All monitored websites are currently healthy."
                : "There are no incidents matching this filter."}
            </p>
          </div>
        ) : (
          <div className="incidents-table-wrapper">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>State</th>
                  <th>Severity</th>
                  <th>Cause</th>
                  <th>Failures</th>
                  <th>Started</th>
                  <th>Duration</th>
                </tr>
              </thead>

              <tbody>
                {visibleIncidents.map(
                  (incident) => (
                    <tr
                      key={incident.id}
                      className={
                        selectedIncidentId ===
                        incident.id
                          ? "incident-row-selected"
                          : ""
                      }
                    >
                      <td>
                        <Link
                          className="incident-website-link"
                          to={`/websites/${incident.website_id}`}
                        >
                          <span className="incident-website-icon">
                            <Siren size={15} />
                          </span>

                          <span>
                            Website #
                            {incident.website_id}
                          </span>
                        </Link>
                      </td>

                      <td>
                        <span
                          className={
                            incident.is_resolved
                              ? "incident-state incident-state-resolved"
                              : "incident-state incident-state-open"
                          }
                        >
                          {incident.is_resolved
                            ? "Resolved"
                            : "Ongoing"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`severity-badge severity-badge-${incident.severity.toLowerCase()}`}
                        >
                          {incident.severity}
                        </span>
                      </td>

                      <td>
                        <span
                          className="incident-cause"
                          title={
                            incident.cause ??
                            "Unknown cause"
                          }
                        >
                          {incident.cause ??
                            "Unknown"}
                        </span>
                      </td>

                      <td>
                        {incident.failure_count}
                      </td>

                      <td>
                        {formatDate(
                          incident.started_at,
                        )}
                      </td>

                      <td>
                        <span className="duration-value">
                          <Clock3 size={13} />

                          {formatDuration(
                            incident.duration_seconds,
                          )}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}