import type { ReactNode } from "react";
import {
  Bell,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
}

function getNavigationClass({
  isActive,
}: {
  isActive: boolean;
}): string {
  return isActive
    ? "navigation-item navigation-item--active"
    : "navigation-item";
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  function handleLogout(): void {
    logout();
    navigate("/login", {
      replace: true,
    });
  }

  const initials =
    user?.full_name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "US";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <div className="brand__icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <strong>SiteCare AI</strong>
            <span>Health Intelligence</span>
          </div>
        </Link>

        <nav className="sidebar__navigation">
          <p className="sidebar__label">
            Workspace
          </p>

          <NavLink
            className={getNavigationClass}
            end
            to="/"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </NavLink>

          <NavLink
            className={getNavigationClass}
            to="/websites/new"
          >
            <PlusCircle size={19} />
            Add website
          </NavLink>

          <NavLink
            className={getNavigationClass}
            to="/incidents"
          >
            <TriangleAlert size={19} />
            Incidents
          </NavLink>

          <NavLink
            className={getNavigationClass}
            to="/ai-insights"
          >
            <BrainCircuit size={19} />
            AI Insights
          </NavLink>

          <NavLink
            className={getNavigationClass}
            to="/maintenance"
          >
            <Wrench size={19} />
            Maintenance
          </NavLink>

          <NavLink
            className={getNavigationClass}
            to="/analytics"
          >
            <ChartNoAxesCombined size={19} />
            Analytics
          </NavLink>

          <p className="sidebar__label sidebar__label--second">
            System
          </p>

          <NavLink
            className={getNavigationClass}
            to="/settings"
          >
            <Settings size={19} />
            Settings
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <div className="user-avatar">
            {initials}
          </div>

          <div className="sidebar-user">
            <strong>
              {user?.full_name ??
                "SiteCare User"}
            </strong>

            <span>
              {user?.email ??
                "Authenticated user"}
            </span>
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">
              Monitoring workspace
            </p>

            <h1>
              Website health dashboard
            </h1>
          </div>

          <div className="topbar__actions">
            <Link
              className="icon-button"
              to="/settings"
              aria-label="Notification settings"
              title="Notification settings"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </Link>

            <div
              className="profile-button"
              aria-label="User profile"
              title={
                user?.full_name ??
                "User profile"
              }
            >
              <CircleUserRound size={21} />
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}