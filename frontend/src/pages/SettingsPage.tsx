import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Mail,
  Save,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../services/api";
import type {
  NotificationPreference,
  NotificationPreferenceUpdate,
} from "../types/dashboard";

export function SettingsPage() {
  const [settings, setSettings] =
    useState<NotificationPreference | null>(null);

  const [emailAddress, setEmailAddress] =
    useState("");

  const [isEnabled, setIsEnabled] =
    useState(true);

  const [notifyOnDowntime, setNotifyOnDowntime] =
    useState(true);

  const [notifyOnRecovery, setNotifyOnRecovery] =
    useState(true);

  const [notifyOnAnomaly, setNotifyOnAnomaly] =
    useState(true);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data =
          await getNotificationSettings();

        setSettings(data);
        setEmailAddress(data.email_address);
        setIsEnabled(data.is_enabled);
        setNotifyOnDowntime(
          data.notify_on_downtime,
        );
        setNotifyOnRecovery(
          data.notify_on_recovery,
        );
        setNotifyOnAnomaly(
          data.notify_on_anomaly,
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load settings.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    const payload: NotificationPreferenceUpdate = {
      email_address: emailAddress.trim(),
      is_enabled: isEnabled,
      notify_on_downtime: notifyOnDowntime,
      notify_on_recovery: notifyOnRecovery,
      notify_on_anomaly: notifyOnAnomaly,
    };

    try {
      const updatedSettings =
        await updateNotificationSettings(
          payload,
        );

      setSettings(updatedSettings);

      setSuccessMessage(
        "Notification settings saved successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-state">
        <LoaderCircle
          className="spin-animation"
          size={30}
        />
        <p>Loading notification settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="page-state page-state--error">
        <ShieldAlert size={34} />
        <h2>Settings unavailable</h2>
        <p>
          {error ??
            "Notification settings could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="settings-header">
        <div className="settings-header__icon">
          <Settings size={26} />
        </div>

        <div>
          <p className="section-eyebrow">
            System configuration
          </p>

          <h2>Notification settings</h2>

          <p>
            Choose where SiteCare sends website downtime,
            recovery and AI anomaly alerts.
          </p>
        </div>
      </section>

      <div className="settings-layout">
        <form
          className="settings-card"
          onSubmit={handleSubmit}
        >
          <div className="settings-card__heading">
            <div>
              <h3>Email alerts</h3>
              <p>
                Configure alert delivery and event
                preferences.
              </p>
            </div>

            <BellRing size={21} />
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          {successMessage && (
            <div
              className="form-success"
              role="status"
            >
              <CheckCircle2 size={17} />
              {successMessage}
            </div>
          )}

          {!settings.smtp_configured && (
            <div className="smtp-warning">
              <CircleAlert size={19} />

              <div>
                <strong>
                  SMTP is not configured
                </strong>

                <p>
                  Add SMTP settings to the backend
                  <code>.env</code> file before real
                  emails can be delivered.
                </p>
              </div>
            </div>
          )}

          {settings.smtp_configured && (
            <div className="smtp-success">
              <CheckCircle2 size={18} />

              <div>
                <strong>
                  Email delivery configured
                </strong>

                <p>
                  The backend SMTP connection has been
                  configured.
                </p>
              </div>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="notification-email">
              Notification email
            </label>

            <div className="input-with-icon">
              <Mail size={17} />

              <input
                id="notification-email"
                type="email"
                value={emailAddress}
                onChange={(event) =>
                  setEmailAddress(
                    event.target.value,
                  )
                }
                placeholder="admin@example.com"
                required
              />
            </div>

            <span>
              SiteCare alerts will be sent to this
              address.
            </span>
          </div>

          <div className="settings-section">
            <h4>Alert delivery</h4>

            <label className="toggle-field settings-toggle">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) =>
                  setIsEnabled(
                    event.target.checked,
                  )
                }
              />

              <span className="toggle-field__control" />

              <span>
                <strong>
                  Enable email notifications
                </strong>

                <small>
                  Allow SiteCare to send configured
                  email alerts.
                </small>
              </span>
            </label>
          </div>

          <div
            className={
              isEnabled
                ? "settings-section"
                : "settings-section settings-section--disabled"
            }
          >
            <h4>Notification events</h4>

            <label className="notification-option">
              <div className="notification-option__icon notification-option__icon--danger">
                <ShieldAlert size={19} />
              </div>

              <div>
                <strong>Website downtime</strong>
                <span>
                  Send an alert when a new incident
                  begins.
                </span>
              </div>

              <input
                type="checkbox"
                checked={notifyOnDowntime}
                disabled={!isEnabled}
                onChange={(event) =>
                  setNotifyOnDowntime(
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="notification-option">
              <div className="notification-option__icon notification-option__icon--success">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <strong>Website recovery</strong>
                <span>
                  Send an alert when an incident is
                  resolved.
                </span>
              </div>

              <input
                type="checkbox"
                checked={notifyOnRecovery}
                disabled={!isEnabled}
                onChange={(event) =>
                  setNotifyOnRecovery(
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="notification-option">
              <div className="notification-option__icon notification-option__icon--ai">
                <Sparkles size={19} />
              </div>

              <div>
                <strong>AI anomaly detection</strong>
                <span>
                  Alert when unusual performance is
                  detected.
                </span>
              </div>

              <input
                type="checkbox"
                checked={notifyOnAnomaly}
                disabled={!isEnabled}
                onChange={(event) =>
                  setNotifyOnAnomaly(
                    event.target.checked,
                  )
                }
              />
            </label>
          </div>

          <div className="settings-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <LoaderCircle
                  className="spin-animation"
                  size={17}
                />
              ) : (
                <Save size={17} />
              )}

              {isSaving
                ? "Saving settings"
                : "Save settings"}
            </button>
          </div>
        </form>

        <aside className="settings-information">
          <div className="settings-information__icon">
            <Bell size={22} />
          </div>

          <h3>Alert behaviour</h3>

          <p>
            SiteCare sends only one downtime email when
            an incident opens. Repeated failed checks do
            not generate duplicate downtime alerts.
          </p>

          <ul>
            <li>
              Downtime alerts are sent when an incident
              starts.
            </li>
            <li>
              Recovery alerts are sent when the next
              successful check closes it.
            </li>
            <li>
              Anomaly alerts require at least 20
              historical measurements.
            </li>
            <li>
              SMTP passwords remain in the backend
              environment file.
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}