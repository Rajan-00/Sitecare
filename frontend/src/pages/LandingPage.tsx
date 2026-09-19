import {
  Activity,
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  Clock3,
  Gauge,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Siren,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "./LandingPage.css";

const features = [
  {
    title: "Uptime monitoring",
    description:
      "Run scheduled availability checks and quickly identify websites that are unavailable.",
    icon: Globe2,
  },
  {
    title: "Response-time tracking",
    description:
      "Measure website response times and review performance history from one dashboard.",
    icon: Gauge,
  },
  {
    title: "Incident management",
    description:
      "Record downtime incidents, recovery events, failure details and incident duration.",
    icon: Siren,
  },
  {
    title: "Performance insights",
    description:
      "Identify unusual response-time behaviour using historical monitoring information.",
    icon: Activity,
  },
  {
    title: "Maintenance planning",
    description:
      "Review website risk levels and maintenance recommendations before problems grow.",
    icon: Wrench,
  },
  {
    title: "Monitoring alerts",
    description:
      "Receive in-app notifications for downtime, recoveries and important monitoring events.",
    icon: BellRing,
  },
];

const steps = [
  {
    number: "01",
    title: "Add your website",
    description:
      "Enter the website name, URL and monitoring interval you want SiteCare to use.",
  },
  {
    number: "02",
    title: "SiteCare checks it automatically",
    description:
      "Scheduled checks measure availability, HTTP status and response time in the background.",
  },
  {
    number: "03",
    title: "Review and respond",
    description:
      "Use the dashboard, incident history and alerts to understand and resolve problems.",
  },
];

const benefits = [
  "Centralized website health overview",
  "Historical uptime and response-time records",
  "Clear downtime and recovery timelines",
  "CSV and PDF monitoring reports",
  "Account activity and security history",
  "Configurable monitoring intervals",
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-navigation">
          <Link
            className="landing-brand"
            to="/"
            aria-label="SiteCare home"
          >
            <span className="landing-brand-icon">
              <ShieldCheck size={23} strokeWidth={2.2} />
            </span>

            <span className="landing-brand-text">
              <strong>SiteCare</strong>
              <small>Website monitoring</small>
            </span>
          </Link>

          <nav
            className="landing-nav-links"
            aria-label="Landing page navigation"
          >
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#platform">Platform</a>
            <a href="#security">Security</a>
          </nav>

          <div className="landing-header-actions">
            {isAuthenticated ? (
              <Link
                className="landing-button landing-button-primary"
                to="/dashboard"
              >
                Open dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  className="landing-login-link"
                  to="/login"
                >
                  Sign in
                </Link>

                <Link
                  className="landing-button landing-button-primary"
                  to="/register"
                >
                  Start monitoring
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-content">
              <div className="landing-eyebrow">
                <span />
                Website uptime and performance monitoring
              </div>

              <h1>
                Know when your website needs attention.
              </h1>

              <p className="landing-hero-description">
                SiteCare monitors website availability,
                response times and incidents so you can find
                problems early and keep every website reliable.
              </p>

              <div className="landing-hero-actions">
                <Link
                  className="landing-button landing-button-primary landing-button-large"
                  to={
                    isAuthenticated
                      ? "/dashboard"
                      : "/register"
                  }
                >
                  {isAuthenticated
                    ? "Go to dashboard"
                    : "Create free account"}

                  <ArrowRight size={17} />
                </Link>

                <a
                  className="landing-button landing-button-secondary landing-button-large"
                  href="#how-it-works"
                >
                  See how it works
                </a>
              </div>

              <div className="landing-hero-note">
                <CheckCircle2 size={16} />

                <span>
                  Set up your first website in a few minutes.
                </span>
              </div>
            </div>

            <div className="landing-product-preview">
              <div className="preview-window">
                <div className="preview-window-header">
                  <div className="preview-window-title">
                    <span className="preview-logo">
                      <ShieldCheck size={16} />
                    </span>

                    <div>
                      <strong>Monitoring overview</strong>
                      <small>Live website status</small>
                    </div>
                  </div>

                  <span className="preview-live-status">
                    <i />
                    Live
                  </span>
                </div>

                <div className="preview-statistics">
                  <div>
                    <span>Websites</span>
                    <strong>4</strong>
                  </div>

                  <div>
                    <span>Operational</span>
                    <strong className="preview-success">
                      4
                    </strong>
                  </div>

                  <div>
                    <span>Active incidents</span>
                    <strong>0</strong>
                  </div>
                </div>

                <div className="preview-table">
                  <div className="preview-table-heading">
                    <span>Website</span>
                    <span>Status</span>
                    <span>Response</span>
                  </div>

                  <div className="preview-website-row">
                    <div className="preview-website">
                      <span className="preview-website-icon">
                        <Globe2 size={15} />
                      </span>

                      <div>
                        <strong>Company website</strong>
                        <small>company.example</small>
                      </div>
                    </div>

                    <span className="preview-status">
                      <CheckCircle2 size={13} />
                      Operational
                    </span>

                    <span className="preview-response">
                      184 ms
                    </span>
                  </div>

                  <div className="preview-website-row">
                    <div className="preview-website">
                      <span className="preview-website-icon">
                        <Globe2 size={15} />
                      </span>

                      <div>
                        <strong>Customer portal</strong>
                        <small>portal.example</small>
                      </div>
                    </div>

                    <span className="preview-status">
                      <CheckCircle2 size={13} />
                      Operational
                    </span>

                    <span className="preview-response">
                      241 ms
                    </span>
                  </div>

                  <div className="preview-website-row">
                    <div className="preview-website">
                      <span className="preview-website-icon">
                        <Globe2 size={15} />
                      </span>

                      <div>
                        <strong>Documentation</strong>
                        <small>docs.example</small>
                      </div>
                    </div>

                    <span className="preview-status">
                      <CheckCircle2 size={13} />
                      Operational
                    </span>

                    <span className="preview-response">
                      126 ms
                    </span>
                  </div>
                </div>

                <div className="preview-chart">
                  <div className="preview-chart-heading">
                    <div>
                      <strong>Response time</strong>
                      <span>Last monitoring checks</span>
                    </div>

                    <span>Average 184 ms</span>
                  </div>

                  <svg
                    viewBox="0 0 520 130"
                    role="img"
                    aria-label="Example response-time chart"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="landingChartArea"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity="0.2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      className="preview-chart-area"
                      d="M0,92 C35,82 54,88 80,64 C112,35 139,45 165,66 C194,89 218,73 247,76 C278,79 293,45 326,51 C357,57 367,83 397,70 C427,57 448,65 471,45 C491,29 505,38 520,30 L520,130 L0,130 Z"
                    />

                    <path
                      className="preview-chart-line"
                      d="M0,92 C35,82 54,88 80,64 C112,35 139,45 165,66 C194,89 218,73 247,76 C278,79 293,45 326,51 C357,57 367,83 397,70 C427,57 448,65 471,45 C491,29 505,38 520,30"
                    />
                  </svg>
                </div>
              </div>

              <div className="preview-alert-card">
                <span>
                  <BellRing size={17} />
                </span>

                <div>
                  <strong>Monitoring is active</strong>
                  <small>
                    All registered websites are operational.
                  </small>
                </div>

                <Check size={17} />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-monitoring-strip">
          <div className="landing-container">
            <div>
              <Activity size={19} />
              <span>
                Automated health checks
              </span>
            </div>

            <div>
              <Clock3 size={19} />
              <span>
                Response-time history
              </span>
            </div>

            <div>
              <Siren size={19} />
              <span>
                Incident tracking
              </span>
            </div>

            <div>
              <ChartNoAxesCombined size={19} />
              <span>
                Performance analytics
              </span>
            </div>
          </div>
        </section>

        <section
          className="landing-section"
          id="features"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-section-label">
                Monitoring capabilities
              </p>

              <h2>
                Everything needed to monitor website health
              </h2>

              <p>
                Replace disconnected checks and spreadsheets
                with one organized monitoring workspace.
              </p>
            </div>

            <div className="landing-feature-grid">
              {features.map(
                ({
                  title,
                  description,
                  icon: Icon,
                }) => (
                  <article
                    className="landing-feature-card"
                    key={title}
                  >
                    <span className="landing-feature-icon">
                      <Icon size={21} />
                    </span>

                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-how-section"
          id="how-it-works"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-section-label">
                How it works
              </p>

              <h2>
                Start monitoring in three simple steps
              </h2>

              <p>
                SiteCare handles regular website checks while
                you focus on responding to the information.
              </p>
            </div>

            <div className="landing-step-grid">
              {steps.map((step) => (
                <article
                  className="landing-step"
                  key={step.number}
                >
                  <span className="landing-step-number">
                    {step.number}
                  </span>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="landing-section"
          id="platform"
        >
          <div className="landing-container landing-platform-grid">
            <div className="landing-platform-content">
              <p className="landing-section-label">
                One operational workspace
              </p>

              <h2>
                See website health without searching through
                multiple tools
              </h2>

              <p>
                SiteCare organizes your checks, incidents,
                alerts, reports and account activity into one
                clear interface.
              </p>

              <div className="landing-benefit-list">
                {benefits.map((benefit) => (
                  <div key={benefit}>
                    <span>
                      <Check size={14} />
                    </span>

                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-platform-card">
              <div className="platform-card-heading">
                <div>
                  <strong>Website health</strong>
                  <span>Current monitoring summary</span>
                </div>

                <span className="platform-operational">
                  Operational
                </span>
              </div>

              <div className="platform-health-score">
                <div>
                  <span>Health score</span>
                  <strong>98%</strong>
                </div>

                <div className="platform-health-track">
                  <span />
                </div>
              </div>

              <div className="platform-metrics">
                <div>
                  <span>Uptime</span>
                  <strong>99.8%</strong>
                </div>

                <div>
                  <span>Average response</span>
                  <strong>184 ms</strong>
                </div>

                <div>
                  <span>Checks completed</span>
                  <strong>1,248</strong>
                </div>

                <div>
                  <span>Open incidents</span>
                  <strong>0</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="landing-security-section"
          id="security"
        >
          <div className="landing-container landing-security-grid">
            <div className="landing-security-icon">
              <LockKeyhole size={28} />
            </div>

            <div>
              <p className="landing-section-label">
                Account security
              </p>

              <h2>
                Your monitoring workspace stays protected
              </h2>

              <p>
                Authenticated access, account activity
                history and website ownership controls help
                keep monitoring information private to each
                account.
              </p>
            </div>

            <Link
              className="landing-button landing-button-secondary"
              to={
                isAuthenticated
                  ? "/dashboard"
                  : "/register"
              }
            >
              {isAuthenticated
                ? "Open workspace"
                : "Create account"}

              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="landing-cta-section">
          <div className="landing-container">
            <div className="landing-cta-card">
              <div>
                <p>Start monitoring today</p>

                <h2>
                  Keep your websites visible, reliable and
                  easier to manage.
                </h2>
              </div>

              <Link
                className="landing-button landing-button-light landing-button-large"
                to={
                  isAuthenticated
                    ? "/dashboard"
                    : "/register"
                }
              >
                {isAuthenticated
                  ? "Go to dashboard"
                  : "Create your account"}

                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-content">
          <div className="landing-brand">
            <span className="landing-brand-icon">
              <ShieldCheck size={21} />
            </span>

            <span className="landing-brand-text">
              <strong>SiteCare</strong>
              <small>Website monitoring</small>
            </span>
          </div>

          <p>
            Website uptime, performance and incident
            monitoring in one workspace.
          </p>

          <div className="landing-footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/login">Sign in</Link>
          </div>

          <span className="landing-copyright">
            © {new Date().getFullYear()} SiteCare
          </span>
        </div>
      </footer>
    </div>
  );
}