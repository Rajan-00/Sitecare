import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ChartNoAxesCombined,
  Clock3,
  Gauge,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getWebsiteChecks,
  getWebsiteMetrics,
} from "../services/api";
import type {
  MonitorCheck,
  WebsiteMetric,
} from "../types/dashboard";

interface ChartPoint {
  id: number;
  time: string;
  fullTime: string;
  responseTime: number | null;
  anomalyValue: number | null;
  statusCode: number | null;
  isUp: boolean;
}

const PIE_COLORS = {
  operational: "#20b877",
  failed: "#e5484d",
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

export function AnalyticsPage() {
  const [websites, setWebsites] =
    useState<WebsiteMetric[]>([]);

  const [selectedWebsiteId, setSelectedWebsiteId] =
    useState<number | null>(null);

  const [checks, setChecks] =
    useState<MonitorCheck[]>([]);

  const [isLoadingWebsites, setIsLoadingWebsites] =
    useState(true);

  const [isLoadingChecks, setIsLoadingChecks] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadWebsites = useCallback(async () => {
    setError(null);
    setIsLoadingWebsites(true);

    try {
      const websiteData =
        await getWebsiteMetrics();

      setWebsites(websiteData);

      setSelectedWebsiteId((currentId) => {
        if (
          currentId !== null
          && websiteData.some(
            (website) =>
              website.website_id === currentId,
          )
        ) {
          return currentId;
        }

        return websiteData[0]?.website_id ?? null;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load websites.",
      );
    } finally {
      setIsLoadingWebsites(false);
    }
  }, []);

  const loadChecks = useCallback(
    async (websiteId: number) => {
      setError(null);
      setIsLoadingChecks(true);

      try {
        const checkData =
          await getWebsiteChecks(
            websiteId,
            100,
          );

        setChecks(checkData);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load monitoring history.",
        );
      } finally {
        setIsLoadingChecks(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadWebsites();
  }, [loadWebsites]);

  useEffect(() => {
    if (selectedWebsiteId !== null) {
      void loadChecks(selectedWebsiteId);
    } else {
      setChecks([]);
    }
  }, [selectedWebsiteId, loadChecks]);

  const selectedWebsite = useMemo(
    () =>
      websites.find(
        (website) =>
          website.website_id
          === selectedWebsiteId,
      ) ?? null,
    [websites, selectedWebsiteId],
  );

  const chartData = useMemo<ChartPoint[]>(() => {
    return [...checks]
      .reverse()
      .map((check) => ({
        id: check.id,
        time: formatTime(check.checked_at),
        fullTime: check.checked_at,
        responseTime: check.response_time_ms,
        anomalyValue: check.is_anomaly
          ? check.response_time_ms
          : null,
        statusCode: check.status_code,
        isUp: check.is_up,
      }));
  }, [checks]);

  const analytics = useMemo(() => {
    const responseTimes = checks
      .map((check) => check.response_time_ms)
      .filter(
        (value): value is number =>
          value !== null,
      );

    const successfulChecks = checks.filter(
      (check) => check.is_up,
    ).length;

    const failedChecks =
      checks.length - successfulChecks;

    const anomalyCount = checks.filter(
      (check) => check.is_anomaly,
    ).length;

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce(
            (total, value) => total + value,
            0,
          ) / responseTimes.length
        : null;

    const minimumResponseTime =
      responseTimes.length > 0
        ? Math.min(...responseTimes)
        : null;

    const maximumResponseTime =
      responseTimes.length > 0
        ? Math.max(...responseTimes)
        : null;

    const uptimePercentage =
      checks.length > 0
        ? successfulChecks / checks.length * 100
        : 0;

    return {
      successfulChecks,
      failedChecks,
      anomalyCount,
      averageResponseTime,
      minimumResponseTime,
      maximumResponseTime,
      uptimePercentage,
    };
  }, [checks]);

  const availabilityData = [
    {
      name: "Operational",
      value: analytics.successfulChecks,
      color: PIE_COLORS.operational,
    },
    {
      name: "Failed",
      value: analytics.failedChecks,
      color: PIE_COLORS.failed,
    },
  ];

  function handleRefresh() {
    void loadWebsites();

    if (selectedWebsiteId !== null) {
      void loadChecks(selectedWebsiteId);
    }
  }

  if (isLoadingWebsites) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error && websites.length === 0) {
    return (
      <div className="page-state page-state--error">
        <TriangleAlert size={34} />
        <h2>Analytics unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <section className="analytics-header">
        <div>
          <p className="section-eyebrow">
            Performance intelligence
          </p>

          <h2>Website analytics</h2>

          <p>
            Explore response times, availability and AI
            anomaly history for each monitored website.
          </p>
        </div>

        <div className="analytics-controls">
          <label htmlFor="analytics-website">
            Website
          </label>

          <select
            id="analytics-website"
            value={selectedWebsiteId ?? ""}
            onChange={(event) =>
              setSelectedWebsiteId(
                Number(event.target.value),
              )
            }
            disabled={websites.length === 0}
          >
            {websites.map((website) => (
              <option
                key={website.website_id}
                value={website.website_id}
              >
                {website.website_name}
              </option>
            ))}
          </select>

          <button
            className="secondary-button"
            type="button"
            disabled={isLoadingChecks}
            onClick={handleRefresh}
          >
            <RefreshCw
              className={
                isLoadingChecks
                  ? "spin-animation"
                  : ""
              }
              size={17}
            />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {websites.length === 0 ? (
        <section className="dashboard-panel">
          <div className="empty-state">
            <ChartNoAxesCombined size={40} />
            <h3>No analytics available</h3>
            <p>
              Add a website and collect monitoring checks
              to generate performance charts.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="detail-statistics">
            <article className="detail-stat">
              <Clock3 size={21} />

              <div>
                <span>Average response</span>
                <strong>
                  {formatResponseTime(
                    analytics.averageResponseTime,
                  )}
                </strong>
              </div>
            </article>

            <article className="detail-stat">
              <Gauge size={21} />

              <div>
                <span>Response range</span>
                <strong>
                  {formatResponseTime(
                    analytics.minimumResponseTime,
                  )}
                  {" – "}
                  {formatResponseTime(
                    analytics.maximumResponseTime,
                  )}
                </strong>
              </div>
            </article>

            <article className="detail-stat">
              <ShieldCheck size={21} />

              <div>
                <span>Measured uptime</span>
                <strong>
                  {analytics.uptimePercentage.toFixed(2)}%
                </strong>
              </div>
            </article>

            <article className="detail-stat">
              <Sparkles size={21} />

              <div>
                <span>AI anomalies</span>
                <strong>
                  {analytics.anomalyCount}
                </strong>
              </div>
            </article>
          </section>

          <section className="analytics-grid">
            <article className="chart-card chart-card--large">
              <div className="chart-card__heading">
                <div>
                  <h3>Response-time history</h3>
                  <p>
                    Latest 100 monitoring measurements
                  </p>
                </div>

                <span className="chart-website-name">
                  {selectedWebsite?.website_name}
                </span>
              </div>

              {isLoadingChecks ? (
                <div className="chart-loading">
                  <LoaderCircle
                    className="spin-animation"
                    size={25}
                  />
                </div>
              ) : chartData.length === 0 ? (
                <div className="chart-empty">
                  <Activity size={32} />
                  <p>No monitoring checks recorded.</p>
                </div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer
                    width="100%"
                    height={330}
                  >
                    <ComposedChart
                      data={chartData}
                      margin={{
                        top: 18,
                        right: 20,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        stroke="#edf0f5"
                        strokeDasharray="4 4"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="time"
                        tick={{
                          fill: "#8a94a6",
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={{
                          stroke: "#e4e8ef",
                        }}
                        minTickGap={35}
                      />

                      <YAxis
                        tick={{
                          fill: "#8a94a6",
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        unit=" ms"
                      />

                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e3e7ef",
                          borderRadius: "10px",
                          boxShadow:
                            "0 8px 24px rgba(31,42,68,0.1)",
                          fontSize: "11px",
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: "11px",
                          paddingTop: "12px",
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="responseTime"
                        name="Response time"
                        stroke="#4263eb"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: "#4263eb",
                        }}
                        connectNulls
                      />

                      <Scatter
                        dataKey="anomalyValue"
                        name="AI anomaly"
                        fill="#d9468f"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="chart-card">
              <div className="chart-card__heading">
                <div>
                  <h3>Availability</h3>
                  <p>Successful and failed checks</p>
                </div>
              </div>

              {checks.length === 0 ? (
                <div className="chart-empty">
                  <Activity size={32} />
                  <p>No availability data.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer
                    width="100%"
                    height={240}
                  >
                    <PieChart>
                      <Pie
                        data={availabilityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {availabilityData.map(
                          (entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          border:
                            "1px solid #e3e7ef",
                          borderRadius: "10px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="availability-legend">
                    <div>
                      <span className="legend-dot legend-dot--up" />
                      <p>
                        Operational
                        <strong>
                          {analytics.successfulChecks}
                        </strong>
                      </p>
                    </div>

                    <div>
                      <span className="legend-dot legend-dot--down" />
                      <p>
                        Failed
                        <strong>
                          {analytics.failedChecks}
                        </strong>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </article>
          </section>
        </>
      )}
    </>
  );
}