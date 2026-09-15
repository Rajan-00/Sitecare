import {
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getIncidents } from "../services/api";
import type { Incident } from "../types/dashboard";

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
    return `${Math.round(seconds)} seconds`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} minutes`;
  }

  return `${(seconds / 3600).toFixed(1)} hours`;
}

export function IncidentsPage() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadIncidents() {
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
      }
    }

    void loadIncidents();
  }, []);

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

  if (error) {
    return (
      <div className="page-state page-state--error">
        <ShieldAlert size={34} />
        <h2>Incidents unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <div>
          <div className="panel-heading__title">
            <TriangleAlert size={20} />
            <h2>Incident history</h2>
          </div>

          <p>
            Service failures and recorded recoveries.
          </p>
        </div>

        <span className="record-count">
          {incidents.length} incidents
        </span>
      </div>

      {incidents.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={38} />
          <h3>No incidents recorded</h3>
          <p>
            All monitored websites are currently healthy.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="website-table">
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
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>
                    <Link
                      className="website-name-link"
                      to={
                        `/websites/${incident.website_id}`
                      }
                    >
                      Website #{incident.website_id}
                    </Link>
                  </td>

                  <td>
                    <span
                      className={
                        incident.is_resolved
                          ? "incident-state incident-state--resolved"
                          : "incident-state incident-state--open"
                      }
                    >
                      {incident.is_resolved
                        ? "Resolved"
                        : "Ongoing"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        `severity-badge severity-badge--${incident.severity}`
                      }
                    >
                      {incident.severity}
                    </span>
                  </td>

                  <td>{incident.cause ?? "Unknown"}</td>
                  <td>{incident.failure_count}</td>
                  <td>{formatDate(incident.started_at)}</td>

                  <td>
                    <span className="duration-value">
                      <Clock3 size={14} />
                      {formatDuration(
                        incident.duration_seconds,
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}