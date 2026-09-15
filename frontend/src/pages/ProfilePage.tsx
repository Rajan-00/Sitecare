import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  changeAccountPassword,
  getAccountProfile,
  updateAccountProfile,
} from "../services/accountApi";
import type {
  AccountProfile,
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

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<ProfileUpdate>(initialProfile);

  const [account, setAccount] =
    useState<AccountProfile | null>(null);

  const [passwords, setPasswords] =
    useState<PasswordChange>(initialPasswords);

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setProfileError("");

        const data = await getAccountProfile();

        setAccount(data);
        setProfile({
          full_name: data.full_name,
          email: data.email,
        });
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
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
            Manage your personal details and account security.
          </p>
        </div>

        <div className="profile-avatar">
          {profile.full_name.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-card-icon">👤</div>

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
            <div className="profile-card-icon">🔐</div>

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
              {new Date(account.created_at).toLocaleDateString()}
            </strong>
          </div>
        </section>
      )}
    </div>
  );
}