import {
  ArrowLeft,
  Home,
  SearchX,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import "./NotFoundPage.css";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <div className="not-found-code">404</div>

        <div className="not-found-icon">
          <SearchX size={34} />
        </div>

        <h1>Page not found</h1>

        <p>
          The page you requested does not exist or may have
          been moved.
        </p>

        <div className="not-found-actions">
          <Link
            className="not-found-primary"
            to="/"
          >
            <Home size={17} />
            Dashboard
          </Link>

          <button
            type="button"
            className="not-found-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={17} />
            Go back
          </button>
        </div>
      </section>
    </main>
  );
}