# SiteCare AI College Demonstration Guide

## 1. Project Title

**SiteCare AI: An Intelligent Website Health Monitoring, Anomaly Detection and Maintenance Prediction Platform**

## 2. Demonstration Objective

This demonstration shows how SiteCare AI:

- Monitors website availability.
- Measures response time.
- Detects website failures.
- Creates and resolves incidents.
- Detects abnormal performance.
- Predicts maintenance risk.
- Generates reports.
- Sends monitoring notifications.
- Protects user data with authentication.

## 3. Recommended Demonstration Length

The recommended presentation time is approximately 8–12 minutes.

| Section | Time |
|---|---:|
| Introduction | 1 minute |
| Architecture | 1 minute |
| Authentication | 1 minute |
| Dashboard and websites | 2 minutes |
| Incidents and anomaly detection | 2 minutes |
| Maintenance prediction | 1 minute |
| Notifications and reports | 1 minute |
| Testing and conclusion | 1–3 minutes |

## 4. Pre-Demonstration Checklist

Complete these checks before presenting.

### Backend

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
ruff check .
pytest -q
```

### Frontend

```bash
cd frontend
npm run lint
npm run test
npm run build
```

All checks should pass before the presentation.

### Demo data

If demo data has not been created, run:

```bash
cd backend
source .venv/bin/activate
python -m scripts.seed_demo
```

Demo account:

```text
Email: demo@sitecare.local
Password: the password entered during seeding
```

### Browser preparation

Open these pages in separate browser tabs:

```text
Frontend:
http://localhost:5173

API documentation:
http://127.0.0.1:8000/docs

API readiness:
http://127.0.0.1:8000/api/v1/health/ready

GitHub repository:
Your SiteCare GitHub repository
```

## 5. Starting the Application

Use two VS Code terminals.

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Expected address:

```text
http://127.0.0.1:8000
```

Do not use:

```bash
uvicorn main:app --reload
```

The correct import is:

```bash
uvicorn app.main:app --reload
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Expected address:

```text
http://localhost:5173
```

## 6. Suggested Presentation Script

### Introduction

Say:

> SiteCare AI is an intelligent website monitoring platform. It monitors website availability and response time, records downtime incidents, detects unusual performance using machine learning, and predicts when maintenance may be required.

Explain the problem:

> Website owners often discover failures only after users complain. SiteCare continuously monitors registered websites and presents problems through one central dashboard.

### Technology stack

Say:

> The backend is built using FastAPI, SQLAlchemy, Alembic, SQLite and APScheduler. The frontend uses React, TypeScript and Vite. Isolation Forest is used for anomaly detection, while linear regression is used for maintenance prediction.

Open:

```text
docs/ARCHITECTURE.md
```

Show the high-level architecture diagram.

## 7. Authentication Demonstration

Open:

```text
http://localhost:5173/login
```

Explain:

- Passwords are hashed using Argon2.
- The backend returns a JWT after successful login.
- Protected requests include the JWT.
- Invalid or expired sessions return users to the login page.
- Every user only accesses their own websites and monitoring data.

Log in using the demo account.

## 8. Dashboard Demonstration

Open:

```text
/dashboard
```

Show:

- Total monitored websites
- Operational websites
- Incidents
- Average response time
- Overall uptime
- Website health scores
- Current website status
- Total monitoring checks
- Last health-check time

Explain:

> The dashboard combines historical monitoring data into simple operational metrics. It automatically refreshes every 30 seconds while the browser tab is active.

Show the sidebar system-status indicator.

Explain:

> The status indicator checks whether the API, database and monitoring scheduler are ready.

## 9. Website Management Demonstration

Open:

```text
/websites
```

Show:

- Website search
- Current state
- Monitoring interval
- Active or inactive status
- Edit action
- Website details

Select one website.

Show:

- Current status
- Monitoring history
- Response-time chart
- Manual health check
- CSV report
- PDF report

Explain:

> Users can run a manual check, while APScheduler performs automatic checks based on each website’s configured interval.

## 10. Manual Monitoring Check

Choose a safe public website and select the manual check action.

Explain the process:

1. React sends a monitoring request.
2. FastAPI verifies website ownership.
3. The backend sends an HTTP request to the website.
4. The result is stored as a `MonitorCheck`.
5. Anomaly detection analyzes the response time.
6. Incident management processes downtime or recovery.
7. Notification services create applicable alerts.

Do not depend entirely on a live external website during the demonstration. Keep the seeded demo data available as backup.

## 11. Incident Demonstration

Open:

```text
/incidents
```

Show:

- Real website name and hostname
- Open incidents
- Resolved incidents
- Severity
- Failure cause
- Failure count
- Incident duration

Explain:

> Consecutive failures are grouped into one incident. The failure count increases during continued downtime. When the website becomes available again, SiteCare automatically resolves the incident and calculates its duration.

Use the status filter to show open and resolved incidents.

## 12. Anomaly Detection Demonstration

Open:

```text
/anomalies
```

Explain:

> SiteCare uses Isolation Forest to learn normal response-time behaviour. It also applies a statistical deviation check so extreme performance changes can still be detected reliably.

Show:

- Website
- Response time
- Anomaly score
- Detection reason
- Detection timestamp

Mention:

- A minimum of 20 historical values is required.
- Failed requests are handled as incidents rather than response-time anomalies.
- The model has a fixed random state for reproducible results.

## 13. Maintenance Prediction Demonstration

Open:

```text
/maintenance
```

Show:

- Risk level
- Risk score
- Confidence
- Response-time trend
- Failure rate
- Anomaly rate
- Predicted response time
- Maintenance recommendation

Explain:

> The maintenance predictor uses linear regression and operational health factors. It evaluates response-time degradation, failures and anomalies to calculate a maintenance risk score.

Mention:

> This prediction is an early-warning aid. It does not guarantee that a website will fail.

## 14. Analytics Demonstration

Open:

```text
/analytics
```

Show:

- Uptime comparison
- Response-time trends
- Website health statistics
- Historical monitoring performance

Explain:

> Analytics converts stored monitoring checks into visual information that helps identify performance changes over time.

## 15. Notifications Demonstration

Select the notification bell.

Show:

- Unread notification count
- Downtime notification
- Recovery notification
- Anomaly notification
- Mark-as-read action
- Mark-all-as-read action

Open:

```text
/settings
```

Show notification preferences.

Explain:

> Users can control downtime, recovery and anomaly notifications. Email notifications require SMTP credentials, while in-app notifications continue working without SMTP.

## 16. Activity Log Demonstration

Open:

```text
/activity
```

Show:

- Website creation events
- Website updates
- Manual monitoring checks
- Profile changes
- Password changes
- Pagination
- Activity filters

Explain:

> Important account operations are recorded as audit events, improving traceability and security.

## 17. Report Demonstration

Open a website details page.

Download:

- CSV report
- PDF report

Explain:

> Reports include monitoring history and can only be generated for websites owned by the authenticated user.

Open the downloaded report if time permits.

## 18. API Documentation Demonstration

Open:

```text
http://127.0.0.1:8000/docs
```

Show the API groups:

- Authentication
- Websites
- Monitoring
- Dashboard
- Incidents
- Anomalies
- Maintenance predictions
- Notifications
- Reports
- Health

Explain:

> FastAPI generates interactive OpenAPI documentation automatically from the backend routes and schemas.

## 19. Health and Readiness Demonstration

Open:

```text
http://127.0.0.1:8000/api/v1/health
```

Explain:

> The liveness endpoint confirms that the API process is running.

Then open:

```text
http://127.0.0.1:8000/api/v1/health/ready
```

Explain:

> The readiness endpoint verifies the database connection and monitoring scheduler state.

## 20. Automated Testing Demonstration

### Backend tests

```bash
cd backend
source .venv/bin/activate
pytest -q
```

### Backend linting

```bash
ruff check .
```

### Frontend tests

```bash
cd frontend
npm run test
```

### Frontend production build

```bash
npm run build
```

Explain:

> GitHub Actions automatically repeats these checks whenever code is pushed or a pull request is created.

## 21. Important Viva Questions and Answers

### Why did you choose FastAPI?

FastAPI provides request validation, automatic OpenAPI documentation, dependency injection, async support and strong Python type integration.

### Why did you choose React?

React supports reusable components and dynamic dashboard interfaces. TypeScript adds compile-time type safety.

### Why use SQLite?

SQLite is simple, lightweight and appropriate for local development and a college prototype. PostgreSQL would be recommended for a production deployment.

### What is a health check?

A health check sends a request to a website and records whether it responds, its HTTP status, response time and any connection error.

### What is an incident?

An incident represents a continuous period of website failure. Repeated failures update the same incident until the website recovers.

### Why use Isolation Forest?

Isolation Forest is designed to identify unusual observations without requiring labelled anomaly data.

### Why combine machine learning with statistical detection?

Machine-learning output can be less reliable on small or low-variance datasets. Statistical deviation detection provides an additional safeguard for extreme response times.

### What is predictive maintenance?

Predictive maintenance analyzes historical behaviour to estimate whether system performance is degrading and whether maintenance should be scheduled.

### How is the maintenance risk calculated?

The risk score combines:

- Failure rate
- Anomaly rate
- Response-time trend
- Predicted degradation
- Current latency

### How are passwords protected?

Passwords are hashed with Argon2. Plain-text passwords are never saved in the database.

### How is user data protected?

Protected routes validate the JWT and filter database queries using the authenticated user’s ID.

### Why use Alembic?

Alembic records database-schema changes as versioned migrations. This keeps development and deployment databases consistent.

### What happens when SMTP is unavailable?

Email delivery is skipped or fails safely, while website monitoring and in-app notifications continue operating.

### Can the application scale?

The current architecture is appropriate for a college project and small workloads. A production version could use PostgreSQL, Redis and separate background workers.

## 22. Common Problems During Demonstration

### Backend cannot import `main`

Incorrect:

```bash
uvicorn main:app --reload
```

Correct:

```bash
uvicorn app.main:app --reload
```

Run it from the `backend` directory.

### Frontend cannot connect to the API

Confirm the backend is running:

```text
http://127.0.0.1:8000/api/v1/health
```

Check `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Restart the frontend after editing `.env`.

### CORS error

Check `backend/.env`:

```env
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

Restart the backend after editing it.

### Login fails

Recreate the demo account:

```bash
cd backend
source .venv/bin/activate
python -m scripts.seed_demo
```

Use the password entered during seeding.

### Database migration error

Check the current migration:

```bash
alembic current
```

Apply migrations:

```bash
alembic upgrade head
```

Verify:

```bash
alembic check
```

### Dashboard contains no information

Seed the demonstration data:

```bash
python -m scripts.seed_demo
```

Then sign in using:

```text
demo@sitecare.local
```

### Port already in use

For the backend:

```bash
uvicorn app.main:app --reload --port 8001
```

If you change the backend port, update `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api/v1
```

## 23. Presentation Safety Plan

Before presenting:

- Run all tests.
- Seed demo data.
- Restart both servers.
- Log in once to confirm the password.
- Confirm the dashboard loads.
- Confirm `/health/ready` returns ready.
- Keep the terminal windows open.
- Keep API documentation open.
- Avoid editing code during the presentation.
- Keep screenshots available in case internet access fails.
- Do not expose `.env` values or the JWT secret.

## 24. Conclusion Script

Say:

> SiteCare AI demonstrates how website monitoring, incident management, machine-learning anomaly detection and maintenance prediction can be combined into one practical platform. The project includes authentication, automated monitoring, analytics, notifications, reports, tests, migrations and continuous integration. Its modular architecture also allows it to be expanded for larger production environments.