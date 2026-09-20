# Changelog

All notable changes to SiteCare AI are documented in this file.

## [1.0.0] - 2026-09-20

### Added

- User registration and JWT authentication
- Argon2 password hashing
- Protected user-owned resources
- Website creation, editing and deletion
- Automatic scheduled website monitoring
- Manual website health checks
- Response-time and uptime tracking
- Website health scoring
- Incident creation and recovery tracking
- Isolation Forest anomaly detection
- Statistical anomaly verification
- Linear-regression maintenance prediction
- Maintenance risk scores and recommendations
- In-app monitoring notifications
- Email notification preferences
- Account profile and password management
- Account activity and audit logs
- CSV monitoring reports
- PDF monitoring reports
- Responsive React dashboard
- Automatic dashboard refresh
- API, database and scheduler readiness checks
- Live system-status sidebar indicator
- Demo-data generation script
- Backend Pytest test suite
- Frontend Vitest test suite
- GitHub Actions continuous integration
- Dependabot configuration
- System architecture documentation
- College demonstration guide

### Security

- Environment-based JWT secret
- Configurable CORS origins
- Automatic expired-session handling
- User-level database filtering
- Generic authentication error messages
- Security response headers
- Sensitive files excluded from Git
- Database files excluded from Git

### Technical Notes

- Backend: FastAPI, SQLAlchemy, Alembic and SQLite
- Frontend: React, TypeScript and Vite
- Monitoring: APScheduler and HTTPX
- Machine learning: Scikit-learn
- Local development does not require Docker

## Future Development

Planned improvements may include:

- PostgreSQL production database
- Separate background monitoring workers
- SSL certificate monitoring
- Domain-expiration monitoring
- Public status pages
- Team accounts and role-based access
- WebSocket live updates
- Advanced time-series forecasting