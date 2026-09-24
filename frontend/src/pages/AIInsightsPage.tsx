import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  Clock3,
  Gauge,
  Globe2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getAnomalies,
  getWebsiteMetrics,
} from "../services/api";
import type {
  MonitorCheck,
  WebsiteMetric,
} from "../types/dashboard";
import { NEPAL_TIME_ZONE, parseApiDate } from "../utils/dateTime";

import "./PerformancePage.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: NEPAL_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parseApiDate(value));
}

function formatResponseTime(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value)} ms`;
}

function formatScore(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  return value.toFixed(4);
}

export function AIInsightsPage() {
  const [anomalies, setAnomalies] =
    useState<MonitorCheck[]>([]);

  const [websites, setWebsites] =
    useState<WebsiteMetric[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [insightsLoadedAt, setInsightsLoadedAt] =
  useState<number | null>(null);  

  const loadInsights = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const [
          anomalyData,
          websiteData,
        ] = await Promise.all([
          getAnomalies(),
          getWebsiteMetrics(),
        ]);

        setAnomalies(anomalyData);
        setWebsites(websiteData);
        setInsightsLoadedAt(Date.now());
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load performance insights.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const websiteNames = useMemo(() => {
    return new Map(
      websites.map((website) => [
        website.website_id,
        website.website_name,
      ]),
    );
  }, [websites]);

  const affectedWebsiteCount = useMemo(() => {
    return new Set(
      anomalies.map(
        (anomaly) => anomaly.website_id,
      ),
    ).size;
  }, [anomalies]);

  const recentAnomalyCount = useMemo(() => {
  if (insightsLoadedAt === null) {
    return 0;
  }

  const twentyFourHoursAgo =
    insightsLoadedAt - 24 * 60 * 60 * 1000;

  return anomalies.filter(
    (anomaly) =>
      parseApiDate(anomaly.checked_at).getTime() >=
      twentyFourHoursAgo,
  ).length;
}, [anomalies, insightsLoadedAt]);

  const averageAnomalyResponseTime =
    useMemo(() => {
      const responseTimes = anomalies
        .map(
          (anomaly) =>
            anomaly.response_time_ms,
        )
        .filter(
          (value): value is number =>
            value !== null,
        );

      if (responseTimes.length === 0) {
        return null;
      }

      return (
        responseTimes.reduce(
          (total, value) => total + value,
          0,
        ) / responseTimes.length
      );
    }, [anomalies]);

  if (isLoading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />

        <p>Loading performance information...</p>
      </div>
    );
  }

  if (error && anomalies.length === 0) {
    return (
      <div className="page-state page-state--error">
        <TriangleAlert size={34} />

        <h2>Performance insights unavailable</h2>

        <p>{error}</p>

        <button
          className="primary-button"
          type="button"
          onClick={() => void loadInsights()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="performance-page">
      <div className="performance-toolbar">
        <div>
          <span className="performance-status">
            <span />
            Performance analysis active
          </span>

          <p>
            Review response-time changes that differ from
            each website’s normal monitoring history.
          </p>
        </div>

        <button
          type="button"
          className="performance-refresh-button"
          disabled={isRefreshing}
          onClick={() => void loadInsights(true)}
        >
          <RefreshCw
            size={16}
            className={
              isRefreshing
                ? "performance-refresh-spinning"
                : ""
            }
          />

          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="performance-inline-error">
          {error}
        </div>
      )}

      <section className="performance-statistics">
        <article className="performance-stat-card">
          <span className="performance-stat-icon performance-stat-blue">
            <Activity size={19} />
          </span>

          <div>
            <span>Total anomalies</span>
            <strong>{anomalies.length}</strong>
          </div>
        </article>

        <article className="performance-stat-card">
          <span className="performance-stat-icon performance-stat-purple">
            <Globe2 size={19} />
          </span>

          <div>
            <span>Affected websites</span>
            <strong>{affectedWebsiteCount}</strong>
          </div>
        </article>

        <article className="performance-stat-card">
          <span className="performance-stat-icon performance-stat-orange">
            <Gauge size={19} />
          </span>

          <div>
            <span>Last 24 hours</span>
            <strong>{recentAnomalyCount}</strong>
          </div>
        </article>

        <article className="performance-stat-card">
          <span className="performance-stat-icon performance-stat-green">
            <Clock3 size={19} />
          </span>

          <div>
            <span>Average response</span>

            <strong>
              {formatResponseTime(
                averageAnomalyResponseTime,
              )}
            </strong>
          </div>
        </article>
      </section>

      <section className="performance-information">
        <span className="performance-information-icon">
          <ShieldCheck size={19} />
        </span>

        <div>
          <strong>How performance detection works</strong>

          <p>
            A website needs at least 20 successful
            measurements before analysis begins. New
            response times are compared with that website’s
            previous monitoring behaviour.
          </p>
        </div>
      </section>

      <section className="performance-panel">
        <div className="performance-panel-heading">
          <div>
            <h2>Response-time anomalies</h2>

            <p>
              Monitoring results that differ from normal
              historical performance.
            </p>
          </div>

          <span className="performance-record-count">
            {anomalies.length} result
            {anomalies.length === 1 ? "" : "s"}
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="performance-empty-state">
            <ShieldCheck size={38} />

            <h3>No performance anomalies</h3>

            <p>
              No unusual response times have been detected.
              Monitoring will continue as more measurements
              are collected.
            </p>
          </div>
        ) : (
          <div className="performance-table-wrapper">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Result</th>
                  <th>Response time</th>
                  <th>HTTP status</th>
                  <th>Model score</th>
                  <th>Explanation</th>
                  <th>Detected</th>
                </tr>
              </thead>

              <tbody>
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id}>
                    <td>
                      <Link
                        className="performance-website-link"
                        to={`/websites/${anomaly.website_id}`}
                      >
                        <span>
                          <Globe2 size={15} />
                        </span>

                        {websiteNames.get(
                          anomaly.website_id,
                        ) ??
                          `Website #${anomaly.website_id}`}
                      </Link>
                    </td>

                    <td>
                      <span className="performance-anomaly-badge">
                        <TriangleAlert size={13} />
                        Anomaly
                      </span>
                    </td>

                    <td>
                      <strong className="performance-response-value">
                        {formatResponseTime(
                          anomaly.response_time_ms,
                        )}
                      </strong>
                    </td>

                    <td>
                      {anomaly.status_code ?? "—"}
                    </td>

                    <td>
                      <code className="performance-model-score">
                        {formatScore(
                          anomaly.anomaly_score,
                        )}
                      </code>
                    </td>

                    <td>
                      <span
                        className="performance-reason"
                        title={
                          anomaly.anomaly_reason ??
                          "Unusual performance detected."
                        }
                      >
                        {anomaly.anomaly_reason ??
                          "Unusual performance detected."}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        anomaly.checked_at,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
