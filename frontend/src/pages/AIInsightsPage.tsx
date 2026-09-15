import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  BrainCircuit,
  Clock3,
  Globe2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
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
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load AI insights.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInsights();
  }, []);

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
    const twentyFourHoursAgo =
      Date.now() - 24 * 60 * 60 * 1000;

    return anomalies.filter(
      (anomaly) =>
        new Date(
          anomaly.checked_at,
        ).getTime() >= twentyFourHoursAgo,
    ).length;
  }, [anomalies]);

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
        <p>Analyzing monitoring patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state page-state--error">
        <TriangleAlert size={34} />

        <h2>AI insights unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <section className="ai-hero">
        <div className="ai-hero__icon">
          <BrainCircuit size={29} />
        </div>

        <div>
          <div className="ai-hero__title">
            <p className="section-eyebrow">
              Machine-learning analysis
            </p>

            <h2>AI performance insights</h2>
          </div>

          <p>
            Isolation Forest analyzes historical response
            times and identifies unusual performance
            behaviour.
          </p>
        </div>

        <div className="ai-model-status">
          <span />
          Model active
        </div>
      </section>

      <section className="detail-statistics">
        <article className="detail-stat">
          <Sparkles size={21} />

          <div>
            <span>Total anomalies</span>
            <strong>{anomalies.length}</strong>
          </div>
        </article>

        <article className="detail-stat">
          <Globe2 size={21} />

          <div>
            <span>Affected websites</span>
            <strong>{affectedWebsiteCount}</strong>
          </div>
        </article>

        <article className="detail-stat">
          <Activity size={21} />

          <div>
            <span>Last 24 hours</span>
            <strong>{recentAnomalyCount}</strong>
          </div>
        </article>

        <article className="detail-stat">
          <Clock3 size={21} />

          <div>
            <span>Average anomaly response</span>
            <strong>
              {formatResponseTime(
                averageAnomalyResponseTime,
              )}
            </strong>
          </div>
        </article>
      </section>

      <section className="ai-information">
        <ShieldCheck size={20} />

        <div>
          <strong>How detection works</strong>

          <p>
            SiteCare requires at least 20 successful
            measurements for each website. It then compares
            new response times with that website’s normal
            historical behaviour.
          </p>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <div className="panel-heading__title">
              <BrainCircuit size={20} />
              <h2>Detected anomalies</h2>
            </div>

            <p>
              Unusual response times identified by the
              machine-learning model.
            </p>
          </div>

          <span className="record-count">
            {anomalies.length} results
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={39} />

            <h3>No anomalies detected</h3>

            <p>
              SiteCare has not found any unusual response
              times. Each website needs at least 20
              successful checks before analysis begins.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="website-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>AI result</th>
                  <th>Response time</th>
                  <th>HTTP status</th>
                  <th>Model score</th>
                  <th>Explanation</th>
                  <th>Detected at</th>
                </tr>
              </thead>

              <tbody>
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id}>
                    <td>
                      <Link
                        className="website-name-link"
                        to={
                          `/websites/${anomaly.website_id}`
                        }
                      >
                        {websiteNames.get(
                          anomaly.website_id,
                        ) ??
                          `Website #${anomaly.website_id}`}
                      </Link>
                    </td>

                    <td>
                      <span className="anomaly-badge">
                        <Sparkles size={13} />
                        Anomaly
                      </span>
                    </td>

                    <td>
                      <strong className="anomaly-response">
                        {formatResponseTime(
                          anomaly.response_time_ms,
                        )}
                      </strong>
                    </td>

                    <td>
                      {anomaly.status_code ?? "—"}
                    </td>

                    <td>
                      <code className="model-score">
                        {formatScore(
                          anomaly.anomaly_score,
                        )}
                      </code>
                    </td>

                    <td>
                      <span className="anomaly-reason">
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
    </>
  );
}