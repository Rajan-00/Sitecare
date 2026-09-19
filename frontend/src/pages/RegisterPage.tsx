import {
  useState,
  type FormEvent,
} from "react";
import {
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/api";
import "./AuthPage.css";

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
  } = useAuth();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail =
        email.trim().toLowerCase();

      await registerUser({
        full_name: fullName.trim(),
        email: normalizedEmail,
        password,
      });

      await login(
        normalizedEmail,
        password,
      );

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account.",
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
  Start monitoring with confidence.
</h1>

<p>
  Create your account and keep website health, incidents
  and performance history organized in one place.
</p>
        </div>
      </section>

      <section className="auth-form-panel">
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-form__heading">
            <h2>Create account</h2>
            <p>
              Set up your SiteCare administrator
              account.
            </p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="register-name">
              Full name
            </label>

            <div className="input-with-icon">
              <UserRound size={17} />

              <input
                id="register-name"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value,
                  )
                }
                placeholder="Rajan Rawal"
                minLength={2}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="register-email">
              Email address
            </label>

            <div className="input-with-icon">
              <Mail size={17} />

              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="rajan@example.com"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="register-password">
              Password
            </label>

            <div className="input-with-icon">
              <LockKeyhole size={17} />

              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <div className="input-with-icon">
              <LockKeyhole size={17} />

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                placeholder="Repeat password"
                minLength={8}
                required
              />
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
              ? "Creating account"
              : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}