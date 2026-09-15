import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  BrainCircuit,
  CircleGauge,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
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
    return "Learning";
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
  return `maintenance-risk--${riskLevel}`;
}

export function MaintenancePage() {
  const [predictions, setPredictions] =
    useState<MaintenancePrediction[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPredictions() {
      try {
        const data =
          await getMaintenancePredictions();

        setPredictions(data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load predictions.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPredictions();
  }, []);

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
        <p>Calculating maintenance predictions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state page-state--error">
        <TriangleAlert size={34} />
        <h2>Predictions unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <section className="maintenance-hero">
        <div className="maintenance-hero__icon">
          <Wrench size={28} />
        </div>

        <div>
          <p className="section-eyebrow">
            Predictive intelligence
          </p>

          <h2>Maintenance predictions</h2>

          <p>
            SiteCare analyzes response-time trends,
            availability failures and anomalies to identify
            websites that may require maintenance.
          </p>
        </div>

        <div className="ai-model-status">
          <span />
          Prediction engine active
        </div>
      </section>

      <section className="detail-statistics">
        <article className="detail-stat">
          <CircleGauge size={21} />

          <div>
            <span>Average risk</span>
            <strong>
              {averageRiskScore.toFixed(1)}%
            </strong>
          </div>
        </article>

        <article className="detail-stat">
          <TriangleAlert size={21} />

          <div>
            <span>High-risk websites</span>
            <strong>{highRiskCount}</strong>
          </div>
        </article>

        <article className="detail-stat">
          <BrainCircuit size={21} />

          <div>
            <span>Predictions ready</span>
            <strong>{readyPredictions.length}</strong>
          </div>
        </article>

        <article className="detail-stat">
          <Activity size={21} />

          <div>
            <span>Models learning</span>
            <strong>{learningCount}</strong>
          </div>
        </article>
      </section>

      {predictions.length === 0 ? (
        <section className="dashboard-panel">
          <div className="empty-state">
            <ShieldCheck size={39} />
            <h3>No websites available</h3>
            <p>
              Add a website and collect monitoring data
              before generating maintenance predictions.
            </p>

            <Link
              className="primary-button empty-state__button"
              to="/websites/new"
            >
              Add website
            </Link>
          </div>
        </section>
      ) : (
        <section className="prediction-grid">
          {predictions.map((prediction) => {
            const isDegrading =
              prediction.response_time_trend_ms !== null
              && prediction.response_time_trend_ms > 0;

            return (
              <article
                className="prediction-card"
                key={prediction.website_id}
              >
                <div className="prediction-card__header">
                  <div>
                    <Link
                      to={
                        `/websites/${prediction.website_id}`
                      }
                    >
                      {prediction.website_name}
                    </Link>

                    <span>
                      {prediction.website_url}
                    </span>
                  </div>

                  <span
                    className={
                      `maintenance-risk ${getRiskClass(
                        prediction.risk_level,
                      )}`
                    }
                  >
                    {getRiskLabel(
                      prediction.risk_level,
                    )}
                  </span>
                </div>

                <div className="risk-score-section">
                  <div className="risk-score-section__heading">
                    <span>Maintenance risk</span>

                    <strong>
                      {prediction.risk_score.toFixed(1)}%
                    </strong>
                  </div>

                  <div className="risk-progress">
                    <span
                      className={getRiskClass(
                        prediction.risk_level,
                      )}
                      style={{
                        width:
                          `${Math.min(
                            prediction.risk_score,
                            100,
                          )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="prediction-metrics">
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
                      <Sparkles size={14} />
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
                          ? "trend-value--negative"
                          : "trend-value--positive"
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
                      }%
                    </strong>
                  </div>
                </div>

                <div className="confidence-section">
                  <div>
                    <span>Model confidence</span>

                    <strong>
                      {
                        prediction
                          .confidence_percentage
                      }%
                    </strong>
                  </div>

                  <div className="confidence-progress">
                    <span
                      style={{
                        width:
                          `${prediction.confidence_percentage}%`,
                      }}
                    />
                  </div>

                  <small>
                    Based on {prediction.sample_count} valid
                    response-time samples
                  </small>
                </div>

                <div className="recommendation-box">
                  <Wrench size={17} />

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
    </>
  );
}