import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Globe2,
  LoaderCircle,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { createWebsite } from "../services/api";
import "./WebsiteFormPage.css";

interface FormState {
  name: string;
  url: string;
  checkInterval: string;
}

export function AddWebsitePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: "",
    url: "",
    checkInterval: "5",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const website = await createWebsite({
        name: form.name.trim(),
        url: form.url.trim(),
        check_interval_minutes: Number(
          form.checkInterval,
        ),
      });

      navigate(`/websites/${website.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add website.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <Link className="back-link" to="/websites">
        <ArrowLeft size={17} />
        Back to websites
      </Link>

      <Link
  className="secondary-button"
  to="/websites"
>
  Cancel
</Link>

      <section className="form-card">
        <div className="form-card__heading">
          <div className="form-card__icon">
            <Globe2 size={25} />
          </div>

          <div>
            <p className="section-eyebrow">New monitor</p>
            <h2>Add a website</h2>
            <p>
              SiteCare will regularly measure its availability
              and response time.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="website-name">
              Website name
            </label>

            <input
              id="website-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              placeholder="Name your website"
              minLength={2}
              maxLength={120}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="website-url">
              Website URL
            </label>

            <input
              id="website-url"
              type="url"
              value={form.url}
              onChange={(event) =>
                updateField("url", event.target.value)
              }
              placeholder="https://example.com"
              required
            />

            <span>
              Include http:// or https:// in the URL.
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="check-interval">
              Monitoring interval
            </label>

            <select
              id="check-interval"
              value={form.checkInterval}
              onChange={(event) =>
                updateField(
                  "checkInterval",
                  event.target.value,
                )
              }
            >
              <option value="1">Every minute</option>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>

          <div className="form-actions">
            <Link className="secondary-button" to="/websites">
              Cancel
            </Link>

            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle
                  className="spin-animation"
                  size={18}
                />
              ) : (
                <Plus size={18} />
              )}

              {isSubmitting
                ? "Adding website"
                : "Add website"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}