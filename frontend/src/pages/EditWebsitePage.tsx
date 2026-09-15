import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  LoaderCircle,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  deleteWebsite,
  getWebsite,
  updateWebsite,
} from "../services/api";
import type { Website } from "../types/dashboard";

export function EditWebsitePage() {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const numericWebsiteId = Number(websiteId);

  const [website, setWebsite] =
    useState<Website | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState("5");
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWebsite() {
      if (!Number.isInteger(numericWebsiteId)) {
        setError("Invalid website ID.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getWebsite(numericWebsiteId);

        setWebsite(data);
        setName(data.name);
        setUrl(data.url);
        setInterval(
          String(data.check_interval_minutes),
        );
        setIsActive(data.is_active);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load website.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadWebsite();
  }, [numericWebsiteId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await updateWebsite(numericWebsiteId, {
        name: name.trim(),
        url: url.trim(),
        check_interval_minutes: Number(interval),
        is_active: isActive,
      });

      navigate(`/websites/${numericWebsiteId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update website.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!website) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${website.name}" and all its monitoring history?`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await deleteWebsite(numericWebsiteId);
      navigate("/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete website.",
      );
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />
        <p>Loading website settings...</p>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="page-state page-state--error">
        <h2>Website unavailable</h2>
        <p>{error ?? "Website not found."}</p>

        <Link className="primary-button" to="/">
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="form-page">
      <Link
        className="back-link"
        to={`/websites/${numericWebsiteId}`}
      >
        <ArrowLeft size={17} />
        Back to website
      </Link>

      <section className="form-card">
        <div className="form-card__heading">
          <div className="form-card__icon">
            <Settings size={25} />
          </div>

          <div>
            <p className="section-eyebrow">
              Monitor settings
            </p>
            <h2>Edit website</h2>
            <p>
              Update monitoring settings or disable
              scheduled checks.
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
            <label htmlFor="edit-name">
              Website name
            </label>

            <input
              id="edit-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              minLength={2}
              maxLength={120}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-url">
              Website URL
            </label>

            <input
              id="edit-url"
              type="url"
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-interval">
              Monitoring interval
            </label>

            <select
              id="edit-interval"
              value={interval}
              onChange={(event) =>
                setInterval(event.target.value)
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

          <label className="toggle-field">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(event.target.checked)
              }
            />

            <span className="toggle-field__control" />

            <span>
              <strong>Automatic monitoring</strong>
              <small>
                Run scheduled checks for this website.
              </small>
            </span>
          </label>

          <div className="form-actions form-actions--between">
            <button
              className="danger-button"
              type="button"
              disabled={isDeleting || isSaving}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? (
                <LoaderCircle
                  className="spin-animation"
                  size={17}
                />
              ) : (
                <Trash2 size={17} />
              )}

              {isDeleting ? "Deleting" : "Delete"}
            </button>

            <div className="form-actions__right">
              <Link
                className="secondary-button"
                to={`/websites/${numericWebsiteId}`}
              >
                Cancel
              </Link>

              <button
                className="primary-button"
                type="submit"
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <LoaderCircle
                    className="spin-animation"
                    size={17}
                  />
                ) : (
                  <Save size={17} />
                )}

                {isSaving ? "Saving" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}