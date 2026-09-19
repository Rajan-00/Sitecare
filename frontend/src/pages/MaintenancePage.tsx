import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  CircleGauge,
  Clock3,
  Database,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getMaintenancePredictions,
} from "../services/api";
import type {
  MaintenancePrediction,
  MaintenanceRiskLevel,
} from "../types/dashboard";

import "./MaintenancePage.css";

function formatResponseTime(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value)} ms`;
}

function formatTrend(
  value: number | null,
): string {
  if (value === null) {
    return "Collecting data";
  }

  if (Math.abs(value) < 0.01) {
    return "Stable";
  }

  const symbol = value > 0 ? "+" : "";

  return `${symbol}${value.toFixed(2)} ms/check`;
}

function getRiskLabel(
  riskLevel: MaintenanceRiskLevel,
): string {
  if (riskLevel === "unknown") {
    return "Learning";
  }

  return (
    riskLevel.charAt(0).toUpperCase()
    + riskLevel.slice(1)
  );
}

function getRiskClass(
  riskLevel: MaintenanceRiskLevel,
): string {
  return `maintenance-risk-${riskLevel}`;
}

export function MaintenancePage() {
  const [predictions, setPredictions] =
    useState<MaintenancePrediction[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadPredictions = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const data =
          await getMaintenancePredictions();

        setPredictions(data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load maintenance assessments.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPredictions();
  }, [loadPredictions]);

  const readyPredictions = useMemo(
    () =>
      predictions.filter(
        (prediction) =>
          prediction.prediction_status === "ready",
      ),
    [predictions],
  );

  const highRiskCount = useMemo(
    () =>
      predictions.filter(
        (prediction) =>
          prediction.risk_level === "high"
          || prediction.risk_level === "critical",
      ).length,
    [predictions],
  );

  const learningCount = useMemo(
    () =>
      predictions.filter(
        (prediction) =>
          prediction.prediction_status === "learning",
      ).length,
    [predictions],
  );

  const averageRiskScore = useMemo(() => {
    if (readyPredictions.length === 0) {
      return 0;
    }

    return (
      readyPredictions.reduce(
        (total, prediction) =>
          total + prediction.risk_score,
        0,
      ) / readyPredictions.length
    );
  }, [readyPredictions]);

  if (isLoading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />

        <p>Loading maintenance assessments...</p>
      </div>
    );
  }

  if (error && predictions.length === 0) {
    return (
      <div className="page-state page-state--error">
        <TriangleAlert size={34} />

        <h2>Maintenance data unavailable</h2>

        <p>{error}</p>

        <button
          className="primary-button"
          type="button"
          onClick={() => void loadPredictions()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="maintenance-page">
      <div className="maintenance-toolbar">
        <div>
          <span className="maintenance-status">
            <span />
            Maintenance assessment active
          </span>

          <p>
            Review performance trends, failure rates and
            maintenance recommendations for each website.
          </p>
        </div>

        <button
          type="button"
          className="maintenance-refresh-button"
          disabled={isRefreshing}
          onClick={() =>
            void loadPredictions(true)
          }
        >
          <RefreshCw
            size={16}
            className={
              isRefreshing
                ? "maintenance-refresh-spinning"
                : ""
            }
          />

          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="maintenance-inline-error">
          {error}
        </div>
      )}

      <section className="maintenance-statistics">
        <article className="maintenance-stat-card">
          <span className="maintenance-stat-icon maintenance-stat-blue">
            <CircleGauge size={19} />
          </span>

          <div>
            <span>Average risk</span>

            <strong>
              {averageRiskScore.toFixed(1)}%
            </strong>
          </div>
        </article>

        <article className="maintenance-stat-card">
          <span className="maintenance-stat-icon maintenance-stat-red">
            <TriangleAlert size={19} />
          </span>

          <div>
            <span>High-risk websites</span>
            <strong>{highRiskCount}</strong>
          </div>
        </article>

        <article className="maintenance-stat-card">
          <span className="maintenance-stat-icon maintenance-stat-green">
            <ShieldCheck size={19} />
          </span>

          <div>
            <span>Assessments ready</span>
            <strong>{readyPredictions.length}</strong>
          </div>
        </article>

        <article className="maintenance-stat-card">
          <span className="maintenance-stat-icon maintenance-stat-purple">
            <Database size={19} />
          </span>

          <div>
            <span>Collecting data</span>
            <strong>{learningCount}</strong>
          </div>
        </article>
      </section>

      {predictions.length === 0 ? (
        <section className="maintenance-empty-panel">
          <ShieldCheck size={38} />

          <h3>No websites available</h3>

          <p>
            Add a website and collect monitoring data before
            maintenance assessments can be generated.
          </p>

          <Link
            className="maintenance-primary-button"
            to="/websites/new"
          >
            Add website
          </Link>
        </section>
      ) : (
        <section className="maintenance-grid">
          {predictions.map((prediction) => {
            const isDegrading =
              prediction.response_time_trend_ms !== null
              && prediction.response_time_trend_ms > 0;

            return (
              <article
                className="maintenance-card"
                key={prediction.website_id}
              >
                <header className="maintenance-card-header">
                  <div className="maintenance-website">
                    <span className="maintenance-website-icon">
                      <Wrench size={17} />
                    </span>

                    <div>
                      <Link
                        to={`/websites/${prediction.website_id}`}
                      >
                        {prediction.website_name}
                      </Link>

                      <span>
                        {prediction.website_url}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`maintenance-risk ${getRiskClass(
                      prediction.risk_level,
                    )}`}
                  >
                    {getRiskLabel(
                      prediction.risk_level,
                    )}
                  </span>
                </header>

                <div className="maintenance-risk-section">
                  <div className="maintenance-risk-heading">
                    <span>Maintenance risk</span>

                    <strong>
                      {prediction.risk_score.toFixed(1)}%
                    </strong>
                  </div>

                  <div className="maintenance-risk-track">
                    <span
                      className={getRiskClass(
                        prediction.risk_level,
                      )}
                      style={{
                        width: `${Math.min(
                          prediction.risk_score,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="maintenance-metrics">
                  <div>
                    <span>
                      <Clock3 size={14} />
                      Current average
                    </span>

                    <strong>
                      {formatResponseTime(
                        prediction
                          .current_average_response_time_ms,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <Activity size={14} />
                      Predicted response
                    </span>

                    <strong>
                      {formatResponseTime(
                        prediction
                          .predicted_response_time_ms,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {isDegrading ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}

                      Performance trend
                    </span>

                    <strong
                      className={
                        isDegrading
                          ? "maintenance-trend-negative"
                          : "maintenance-trend-positive"
                      }
                    >
                      {formatTrend(
                        prediction
                          .response_time_trend_ms,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <TriangleAlert size={14} />
                      Failure rate
                    </span>

                    <strong>
                      {
                        prediction
                          .failure_rate_percentage
                      }
                      %
                    </strong>
                  </div>
                </div>

                <div className="maintenance-confidence">
                  <div>
                    <span>Assessment confidence</span>

                    <strong>
                      {
                        prediction
                          .confidence_percentage
                      }
                      %
                    </strong>
                  </div>

                  <div className="maintenance-confidence-track">
                    <span
                      style={{
                        width:
                          `${prediction.confidence_percentage}%`,
                      }}
                    />
                  </div>

                  <small>
                    Based on {prediction.sample_count} valid
                    monitoring samples
                  </small>
                </div>

                <div className="maintenance-recommendation">
                  <Wrench size={16} />

                  <div>
                    <strong>Recommendation</strong>
                    <p>{prediction.recommendation}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}