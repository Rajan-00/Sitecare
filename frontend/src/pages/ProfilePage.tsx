import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  Clock3,
  Globe2,
  History,
  KeyRound,
  RefreshCw,
  Siren,
  UserRound,
} from "lucide-react";

import {
  changeAccountPassword,
  getAccountProfile,
  getAccountStatistics,
  updateAccountProfile,
} from "../services/accountApi";
import type {
  AccountProfile,
  AccountStatistics,
  PasswordChange,
  ProfileUpdate,
} from "../types/account";

import "./ProfilePage.css";

const initialProfile: ProfileUpdate = {
  full_name: "",
  email: "",
};

const initialPasswords: PasswordChange = {
  current_password: "",
  new_password: "",
};

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<ProfileUpdate>(initialProfile);

  const [account, setAccount] =
    useState<AccountProfile | null>(null);

  const [statistics, setStatistics] =
    useState<AccountStatistics | null>(null);

  const [passwords, setPasswords] =
    useState<PasswordChange>(initialPasswords);

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [refreshingStatistics, setRefreshingStatistics] =
    useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const loadStatistics = useCallback(async () => {
    try {
      setRefreshingStatistics(true);

      const data = await getAccountStatistics();

      setStatistics(data);
    } catch {
      // The profile can still work if statistics fail.
    } finally {
      setRefreshingStatistics(false);
    }
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setProfileError("");

        const [profileData, statisticsData] =
          await Promise.all([
            getAccountProfile(),
            getAccountStatistics(),
          ]);

        setAccount(profileData);
        setStatistics(statisticsData);

        setProfile({
          full_name: profileData.full_name,
          email: profileData.email,
        });
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Unable to load your account.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, []);

  function handleProfileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePasswordChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    if (profile.full_name.trim().length < 2) {
      setProfileError(
        "Full name must contain at least 2 characters.",
      );
      return;
    }

    try {
      setSavingProfile(true);

      const updatedProfile = await updateAccountProfile({
        full_name: profile.full_name.trim(),
        email: profile.email.trim().toLowerCase(),
      });

      setAccount(updatedProfile);

      setProfile({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
      });

      setProfileSuccess("Profile updated successfully.");

      await loadStatistics();
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (passwords.new_password.length < 8) {
      setPasswordError(
        "New password must contain at least 8 characters.",
      );
      return;
    }

    if (passwords.new_password !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (
      passwords.current_password === passwords.new_password
    ) {
      setPasswordError(
        "New password must be different from your current password.",
      );
      return;
    }

    try {
      setSavingPassword(true);

      const response = await changeAccountPassword(passwords);

      setPasswordSuccess(response.message);
      setPasswords(initialPasswords);
      setConfirmPassword("");

      await loadStatistics();
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        Loading account information...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <div>
          <p className="profile-eyebrow">Account settings</p>
          <h1>Profile</h1>
          <p>
            Manage your account and review your monitoring
            statistics.
          </p>
        </div>

        <div className="profile-avatar">
          {profile.full_name.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      <section className="profile-statistics-section">
        <div className="profile-section-heading">
          <div>
            <h2>Account overview</h2>
            <p>Your SiteCare monitoring activity.</p>
          </div>

          <button
            type="button"
            className="profile-refresh-button"
            onClick={() => void loadStatistics()}
            disabled={refreshingStatistics}
          >
            <RefreshCw
              size={16}
              className={
                refreshingStatistics
                  ? "profile-refresh-spinning"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="profile-statistics-grid">
          <article className="profile-stat-card">
            <div className="profile-stat-icon profile-stat-blue">
              <Globe2 size={21} />
            </div>
            <div>
              <span>Total websites</span>
              <strong>
                {statistics?.total_websites ?? 0}
              </strong>
            </div>
          </article>

          <article className="profile-stat-card">
            <div className="profile-stat-icon profile-stat-green">
              <Activity size={21} />
            </div>
            <div>
              <span>Active websites</span>
              <strong>
                {statistics?.active_websites ?? 0}
              </strong>
            </div>
          </article>

          <article className="profile-stat-card">
            <div className="profile-stat-icon profile-stat-purple">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Health checks</span>
              <strong>
                {statistics?.total_health_checks ?? 0}
              </strong>
            </div>
          </article>

          <article className="profile-stat-card">
            <div className="profile-stat-icon profile-stat-red">
              <Siren size={21} />
            </div>
            <div>
              <span>Incidents detected</span>
              <strong>
                {statistics?.total_incidents ?? 0}
              </strong>
            </div>
          </article>

          <article className="profile-stat-card">
            <div className="profile-stat-icon profile-stat-orange">
              <History size={21} />
            </div>
            <div>
              <span>Account activities</span>
              <strong>
                {statistics?.total_activities ?? 0}
              </strong>
            </div>
          </article>
        </div>

        <div className="profile-last-activity">
          <History size={17} />

          <span>
            Last recorded activity:{" "}
            <strong>
              {statistics?.last_activity_at
                ? formatDate(statistics.last_activity_at)
                : "No activity recorded"}
            </strong>
          </span>
        </div>
      </section>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-card-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h2>Personal information</h2>
              <p>Update your name and email address.</p>
            </div>
          </div>

          {profileError && (
            <div className="profile-message profile-message-error">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="profile-message profile-message-success">
              {profileSuccess}
            </div>
          )}

          <form
            className="profile-form"
            onSubmit={handleProfileSubmit}
          >
            <label>
              Full name
              <input
                name="full_name"
                type="text"
                value={profile.full_name}
                onChange={handleProfileChange}
                minLength={2}
                maxLength={100}
                required
              />
            </label>

            <label>
              Email address
              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                required
              />
            </label>

            <button
              className="profile-primary-button"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile
                ? "Saving changes..."
                : "Save profile"}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-card-icon">
              <KeyRound size={20} />
            </div>

            <div>
              <h2>Change password</h2>
              <p>Use a strong and unique password.</p>
            </div>
          </div>

          {passwordError && (
            <div className="profile-message profile-message-error">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="profile-message profile-message-success">
              {passwordSuccess}
            </div>
          )}

          <form
            className="profile-form"
            onSubmit={handlePasswordSubmit}
          >
            <label>
              Current password
              <input
                name="current_password"
                type="password"
                value={passwords.current_password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
            </label>

            <label>
              New password
              <input
                name="new_password"
                type="password"
                value={passwords.new_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button
              className="profile-primary-button"
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword
                ? "Changing password..."
                : "Change password"}
            </button>
          </form>
        </section>
      </div>

      {account && (
        <section className="profile-card profile-account-card">
          <div>
            <span>Account ID</span>
            <strong>#{account.id}</strong>
          </div>

          <div>
            <span>Account status</span>
            <strong
              className={
                account.is_active
                  ? "account-active"
                  : "account-inactive"
              }
            >
              {account.is_active ? "Active" : "Inactive"}
            </strong>
          </div>

          <div>
            <span>Member since</span>
            <strong>
              {formatDate(account.created_at)}
            </strong>
          </div>
        </section>
      )}
    </div>
  );
}