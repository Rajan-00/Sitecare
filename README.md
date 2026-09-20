# SiteCare AI

SiteCare AI is an intelligent website monitoring platform that tracks website availability, response times, incidents, anomalies, and maintenance risks from one dashboard.

## Features

- User registration and JWT authentication
- Website monitoring and scheduled health checks
- Response-time and uptime analytics
- Incident creation and recovery tracking
- Isolation Forest anomaly detection
- Predictive maintenance insights
- In-app and email notification preferences
- Monitoring history exports in CSV and PDF
- Account activity logs
- Responsive React dashboard

## Technology Stack

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- SQLite
- APScheduler
- Scikit-learn
- Pytest
- Ruff

### Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide React
- Recharts
- Oxlint

## Project Structure

```text
Sitecare/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── migrations/
│   └── tests/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── types/
└── README.md
```

## Local Development

### 1. Clone the repository

```bash
git clone git@github.com:Rajan-00/Sitecare.git
cd Sitecare
```

### 2. Start the backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## Testing

### Backend

```bash
cd backend
source .venv/bin/activate
ruff check .
pytest -q
alembic check
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

## Environment Variables

Copy the example environment files before running the application:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Never commit real passwords, JWT secrets, SMTP credentials, databases, or `.env` files.

## Author

**Rajan Rawal**

GitHub: [Rajan-00](https://github.com/Rajan-00)

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [College Demonstration Guide](docs/COLLEGE_DEMO.md)
- API documentation is available at `http://127.0.0.1:8000/docs` while the backend is running.

## License

This project was developed as an academic software project.