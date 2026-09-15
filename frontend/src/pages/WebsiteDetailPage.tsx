import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  ArrowLeft,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Settings,
  Sparkles,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { StatusBadge } from "../components/StatusBadge";
import {
  downloadWebsiteReport,
  getWebsite,
  getWebsiteChecks,
  getWebsiteStatus,
  runWebsiteCheck,
} from "../services/api";
import type {
  MonitorCheck,
  Website,
  WebsiteStatusResponse,
} from "../types/dashboard";



function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatResponseTime(
  value: number | null,
): string {
  return value === null ? "—" : `${Math.round(value)} ms`;
}

export function WebsiteDetailPage() {
  const { websiteId } = useParams();

  const numericWebsiteId = Number(websiteId);

  const [website, setWebsite] =
    useState<Website | null>(null);

  const [status, setStatus] =
    useState<WebsiteStatusResponse | null>(null);

  const [checks, setChecks] =
    useState<MonitorCheck[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWebsite = useCallback(async () => {
    if (!Number.isInteger(numericWebsiteId)) {
      setError("Invalid website ID.");
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const [
        websiteData,
        statusData,
        checksData,
      ] = await Promise.all([
        getWebsite(numericWebsiteId),
        getWebsiteStatus(numericWebsiteId),
        getWebsiteChecks(numericWebsiteId),
      ]);

      setWebsite(websiteData);
      setStatus(statusData);
      setChecks(checksData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load website.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [numericWebsiteId]);

  useEffect(() => {
    void loadWebsite();
  }, [loadWebsite]);

  async function handleCheckNow() {
    setIsChecking(true);
    setError(null);

    try {
      await runWebsiteCheck(numericWebsiteId);
      await loadWebsite();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Website check failed.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleReportDownload(
  format: "pdf" | "csv",
) {
  setError(null);

  try {
    await downloadWebsiteReport(
      numericWebsiteId,
      format,
    );
  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : "Unable to download report.",
    );
  }
}

  if (isLoading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />
        <p>Loading website information...</p>
      </div>
    );
  }

  if (error && !website) {
    return (
      <div className="page-state page-state--error">
        <TriangleAlert size={34} />
        <h2>Website unavailable</h2>
        <p>{error}</p>

        <Link className="primary-button" to="/">
          Return to dashboard
        </Link>
      </div>
    );
  }

  if (!website || !status) {
    return null;
  }

  const successfulChecks = checks.filter(
    (check) => check.is_up,
  ).length;

  const uptimePercentage = checks.length
    ? (
        (successfulChecks / checks.length)
        * 100
      ).toFixed(2)
    : "0.00";

  const responseTimes = checks
    .map((check) => check.response_time_ms)
    .filter(
      (value): value is number => value !== null,
    );

  const averageResponseTime = responseTimes.length
    ? Math.round(
        responseTimes.reduce(
          (total, value) => total + value,
          0,
        ) / responseTimes.length,
      )
    : null;

  return (
    <>
      <div className="details-navigation">
  <Link className="back-link" to="/">
    <ArrowLeft size={17} />
    Back to dashboard
  </Link>

  <div className="dashboard-actions">
    <Link
      className="secondary-button"
      to={`/websites/${numericWebsiteId}/edit`}
    >
      <Settings size={17} />
      Settings
    </Link>

    <button
      className="primary-button"
      type="button"
      disabled={isChecking || !website.is_active}
      onClick={() => void handleCheckNow()}
    >
      {isChecking ? (
        <RefreshCw
          className="spin-animation"
          size={17}
        />
      ) : (
        <Play size={17} />
      )}

      {!website.is_active
        ? "Monitoring disabled"
        : isChecking
          ? "Checking"
          : "Check now"}
    </button>
    <button
  className="secondary-button"
  type="button"
  onClick={() =>
    void handleReportDownload("csv")
  }
>
  <FileSpreadsheet size={17} />
  CSV
</button>

<button
  className="secondary-button"
  type="button"
  onClick={() =>
    void handleReportDownload("pdf")
  }
>
  <FileDown size={17} />
  PDF report
</button>
  </div>
</div>

      {error && (
        <div className="form-error detail-error">
          {error}
        </div>
      )}

      <section className="website-hero">
        <div className="website-hero__identity">
          <div className="website-hero__icon">
            <Globe2 size={28} />
          </div>

          <div>
            <div className="website-hero__title">
              <h2>{website.name}</h2>

              <StatusBadge
                status={status.current_status}
              />
            </div>

            <a
              href={website.url}
              target="_blank"
              rel="noreferrer"
            >
              {website.url}
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="website-hero__meta">
          <span>
            Monitoring every{" "}
            {website.check_interval_minutes} minutes
          </span>
          <span>
            Added {formatDate(website.created_at)}
          </span>
        </div>
      </section>

      <section className="detail-statistics">
        <article className="detail-stat">
          <ShieldCheck size={21} />
          <div>
            <span>Uptime</span>
            <strong>{uptimePercentage}%</strong>
          </div>
        </article>

        <article className="detail-stat">
          <Clock3 size={21} />
          <div>
            <span>Average response</span>
            <strong>
              {formatResponseTime(
                averageResponseTime,
              )}
            </strong>
          </div>
        </article>

        <article className="detail-stat">
          <Activity size={21} />
          <div>
            <span>Total checks</span>
            <strong>{checks.length}</strong>
          </div>
        </article>

        <article className="detail-stat">
          <TriangleAlert size={21} />
          <div>
            <span>Failed checks</span>
            <strong>
              {checks.length - successfulChecks}
            </strong>
          </div>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <div className="panel-heading__title">
              <Activity size={20} />
              <h2>Monitoring history</h2>
            </div>

            <p>
              Latest availability and response-time checks.
            </p>
          </div>

          <span className="record-count">
            {checks.length} results
          </span>
        </div>

        {checks.length === 0 ? (
          <div className="empty-state">
            <Activity size={36} />
            <h3>No checks recorded</h3>
            <p>
              Select Check now to create the first result.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="website-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>HTTP code</th>
                  <th>Response time</th>
                  <th>AI analysis</th>
                  <th>Checked URL</th>
                  <th>Error</th>
                  <th>Checked at</th>
                </tr>
              </thead>

              <tbody>
                {checks.map((check) => (
                  <tr key={check.id}>
                    <td>
                      <StatusBadge
                        status={
                          check.is_up ? "up" : "down"
                        }
                      />
                    </td>

                    <td>
                      {check.status_code ?? "—"}
                    </td>

                    <td>
                      {formatResponseTime(
                        check.response_time_ms,
                      )}
                    </td>

                    <td>
  {check.is_anomaly ? (
    <span
      className="anomaly-badge"
      title={
        check.anomaly_reason ??
        "Unusual response time detected."
      }
    >
      <Sparkles size={13} />
      Anomaly
    </span>
  ) : check.anomaly_score !== null ? (
    <span className="normal-badge">
      Normal
    </span>
  ) : (
    <span className="analysis-pending">
      Learning
    </span>
  )}
</td>

                    <td>
                      <a
                        className="table-link"
                        href={check.checked_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {check.checked_url}
                      </a>
                    </td>

                    <td>
                      {check.error_message ?? "None"}
                    </td>

                    <td>
                      {formatDate(check.checked_at)}
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