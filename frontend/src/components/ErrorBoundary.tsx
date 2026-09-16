import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Home,
  RefreshCw,
} from "lucide-react";

import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(
    error: Error,
  ): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error.message ||
        "An unexpected application error occurred.",
    };
  }

  componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ) {
    console.error(
      "SiteCare frontend error:",
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: "",
    });

    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="error-boundary-page">
        <section className="error-boundary-card">
          <div className="error-boundary-icon">
            <AlertTriangle size={34} />
          </div>

          <p className="error-boundary-eyebrow">
            Application error
          </p>

          <h1>Something went wrong</h1>

          <p className="error-boundary-description">
            SiteCare encountered an unexpected problem.
            Your monitoring data has not been deleted.
          </p>

          {this.state.errorMessage && (
            <div className="error-boundary-message">
              {this.state.errorMessage}
            </div>
          )}

          <div className="error-boundary-actions">
            <button
              type="button"
              className="error-boundary-primary"
              onClick={this.handleRetry}
            >
              <RefreshCw size={17} />
              Reload application
            </button>

            <button
              type="button"
              className="error-boundary-secondary"
              onClick={this.handleGoHome}
            >
              <Home size={17} />
              Go to dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }
}