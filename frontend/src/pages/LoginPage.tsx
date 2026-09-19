import {
  useState,
  type FormEvent,
} from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    isAuthenticated,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await login(
        email.trim().toLowerCase(),
        password,
      );

      const routeState = location.state as {
        from?: string;
      } | null;

      navigate(
        routeState?.from ?? "/dashboard",
        { replace: true },
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <div className="brand__icon">
            <ShieldCheck size={26} />
          </div>

          <div>
            <strong>SiteCare AI</strong>
            <span>Website monitoring</span>
          </div>
        </div>

        <div className="auth-brand-content">
<p className="section-eyebrow">
  Website monitoring platform
</p>

<h1>
  Know when your websites need attention.
</h1>

<p>
  Track uptime, response times and incidents from one
  reliable monitoring workspace.
</p>
        </div>
      </section>

      <section className="auth-form-panel">
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-form__heading">
            <h2>Welcome back</h2>
            <p>
              Sign in to access your monitoring
              workspace.
            </p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="login-email">
              Email address
            </label>

            <div className="input-with-icon">
              <Mail size={17} />

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="rajan@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="login-password">
              Password
            </label>

            <div className="input-with-icon password-input">
              <LockKeyhole size={17} />

              <input
                id="login-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                aria-label="Show or hide password"
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle
                className="spin-animation"
                size={18}
              />
            )}

            {isSubmitting
              ? "Signing in"
              : "Sign in"}
          </button>

          <p className="auth-switch">
            Don’t have an account?{" "}
            <Link to="/register">
              Create account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}