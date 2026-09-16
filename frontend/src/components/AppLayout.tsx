import { useState } from "react";
import {
  Activity,
  Bell,
  Bot,
  ChartNoAxesCombined,
  CircleGauge,
  Globe2,
  History,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Siren,
  UserRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "./AppLayout.css";

interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: CircleGauge,
    end: true,
  },
  {
    label: "Websites",
    path: "/websites",
    icon: Globe2,
  },
  {
    label: "Incidents",
    path: "/incidents",
    icon: Siren,
  },
  {
    label: "AI Insights",
    path: "/anomalies",
    icon: Bot,
  },
  {
    label: "Maintenance",
    path: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    label: "Activity",
    path: "/activity",
    icon: History,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
  },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/") {
    return "Dashboard";
  }

  if (pathname.startsWith("/websites")) {
    return "Websites";
  }

  if (pathname.startsWith("/incidents")) {
    return "Incidents";
  }

  if (pathname.startsWith("/anomalies")) {
    return "AI Insights";
  }

  if (pathname.startsWith("/maintenance")) {
    return "Predictive Maintenance";
  }

  if (pathname.startsWith("/analytics")) {
    return "Analytics";
  }

  if (pathname.startsWith("/settings")) {
    return "Settings";
  }

  if (pathname.startsWith("/activity")) {
    return "Activity Log";
  }

  if (pathname.startsWith("/profile")) {
    return "Profile";
  }

  return "SiteCare AI";
}

function getPageDescription(pathname: string): string {
  if (pathname === "/") {
    return "Monitor, analyze and protect your websites.";
  }

  if (pathname.startsWith("/websites")) {
    return "Manage the websites monitored by SiteCare AI.";
  }

  if (pathname.startsWith("/incidents")) {
    return "Review website downtime and recovery incidents.";
  }

  if (pathname.startsWith("/anomalies")) {
    return "Review unusual website performance detected by AI.";
  }

  if (pathname.startsWith("/maintenance")) {
    return "View predictive maintenance insights and recommendations.";
  }

  if (pathname.startsWith("/analytics")) {
    return "Explore uptime and website performance analytics.";
  }

  if (pathname.startsWith("/settings")) {
    return "Configure monitoring and notification preferences.";
  }

  if (pathname.startsWith("/activity")) {
    return "Review recent account and monitoring activity.";
  }

  if (pathname.startsWith("/profile")) {
    return "Manage your SiteCare AI account.";
  }

  return "Website monitoring and intelligence.";
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const pageTitle = getPageTitle(location.pathname);
  const pageDescription = getPageDescription(
    location.pathname,
  );

  const userInitial =
    user?.full_name?.trim().charAt(0).toUpperCase() || "U";

  async function handleLogout(): Promise<void> {
    await logout();
    navigate("/login", { replace: true });
  }

  function closeSidebar(): void {
    setSidebarOpen(false);
  }

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={
          sidebarOpen
            ? "app-sidebar app-sidebar-open"
            : "app-sidebar"
        }
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShieldCheck
              size={25}
              strokeWidth={2.4}
            />
          </div>

          <div className="sidebar-brand-text">
            <strong>SiteCare AI</strong>
            <span>Website Intelligence</span>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-health">
          <div className="sidebar-health-icon">
            <Activity size={18} />
          </div>

          <div>
            <strong>Monitoring active</strong>
            <span>Your websites are protected</span>
          </div>

          <div
            className="sidebar-health-dot"
            aria-hidden="true"
          />
        </div>

        <nav
          className="sidebar-navigation"
          aria-label="Main navigation"
        >
          <p className="sidebar-section-label">
            Workspace
          </p>

          {navigationItems.map(
            ({ label, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link sidebar-link-active"
                    : "sidebar-link"
                }
              >
                <Icon
                  className="sidebar-link-icon"
                  size={19}
                  strokeWidth={2}
                />

                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="sidebar-footer-card-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>SiteCare Protection</strong>
              <span>Automatic monitoring enabled</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="header-title">
              <h1>{pageTitle}</h1>
              <p>{pageDescription}</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />

              <span
                className="notification-indicator"
                aria-hidden="true"
              />
            </button>

            <NavLink
              to="/profile"
              aria-label="Open profile"
              className={({ isActive }) =>
                isActive
                  ? "header-profile header-profile-active"
                  : "header-profile"
              }
            >
              <div className="header-profile-avatar">
                {userInitial}
              </div>

              <div className="header-profile-details">
                <strong>
                  {user?.full_name || "SiteCare User"}
                </strong>

                <span>
                  {user?.email || "Account profile"}
                </span>
              </div>

              <UserRound
                className="header-profile-icon"
                size={18}
              />
            </NavLink>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}