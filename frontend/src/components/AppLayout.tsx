import {
  useEffect,
  useState,
} from "react";
import {
  Activity,
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
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import NotificationCenter from "./NotificationCenter";

import "./AppLayout.css";

interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    path: "/dashboard",
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
    label: "Performance",
    path: "/anomalies",
    icon: Activity,
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
];

const accountNavigationItems: NavigationItem[] = [
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

function getPageInformation(pathname: string): {
  title: string;
  description: string;
} {
  if (pathname === "/dashboard") {
    return {
      title: "Overview",
      description:
        "Website health and monitoring summary.",
    };
  }

  if (pathname === "/websites/new") {
    return {
      title: "Add website",
      description:
        "Register a new website for automatic monitoring.",
    };
  }

  if (
    /^\/websites\/\d+\/edit$/.test(pathname)
  ) {
    return {
      title: "Website settings",
      description:
        "Update monitoring configuration and website details.",
    };
  }

  if (/^\/websites\/\d+$/.test(pathname)) {
    return {
      title: "Website details",
      description:
        "Review current health and monitoring history.",
    };
  }

  if (pathname.startsWith("/websites")) {
    return {
      title: "Websites",
      description:
        "Manage monitored websites and health checks.",
    };
  }

  if (pathname.startsWith("/incidents")) {
    return {
      title: "Incidents",
      description:
        "Review downtime events and recoveries.",
    };
  }

  if (
    pathname.startsWith("/anomalies")
    || pathname.startsWith("/ai-insights")
  ) {
    return {
      title: "Performance",
      description:
        "Review unusual response-time behaviour.",
    };
  }

  if (pathname.startsWith("/maintenance")) {
    return {
      title: "Maintenance",
      description:
        "Review website risk and maintenance recommendations.",
    };
  }

  if (pathname.startsWith("/analytics")) {
    return {
      title: "Analytics",
      description:
        "Explore uptime and response-time trends.",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Settings",
      description:
        "Configure monitoring and notification preferences.",
    };
  }

  if (pathname.startsWith("/activity")) {
    return {
      title: "Activity",
      description:
        "Review recent account and monitoring actions.",
    };
  }

  if (pathname.startsWith("/profile")) {
    return {
      title: "Profile",
      description:
        "Manage your personal information and password.",
    };
  }

  if (pathname.startsWith("/notifications")) {
    return {
      title: "Notifications",
      description:
        "Review monitoring and account alerts.",
    };
  }

  return {
    title: "SiteCare",
    description: "Website monitoring platform.",
  };
}

function SidebarNavigationLink({
  item,
  closeSidebar,
}: {
  item: NavigationItem;
  closeSidebar: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={closeSidebar}
      className={({ isActive }) =>
        isActive
          ? "sidebar-link sidebar-link-active"
          : "sidebar-link"
      }
    >
      <Icon
        className="sidebar-link-icon"
        size={18}
        strokeWidth={1.9}
      />

      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const pageInformation = getPageInformation(
    location.pathname,
  );

  const userInitial =
    user?.full_name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "U";

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape"
        && sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [sidebarOpen]);

  function handleLogout(): void {
    logout();
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
        aria-label="Application sidebar"
      >
        <Link
          className="sidebar-brand"
          to="/dashboard"
          onClick={closeSidebar}
        >
          <span className="sidebar-brand-icon">
            <ShieldCheck
              size={22}
              strokeWidth={2.2}
            />
          </span>

          <span className="sidebar-brand-text">
            <strong>SiteCare</strong>
            <small>Website monitoring</small>
          </span>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Close navigation"
            onClick={(event) => {
              event.preventDefault();
              closeSidebar();
            }}
          >
            <X size={20} />
          </button>
        </Link>

        <div className="sidebar-workspace">
          <div className="sidebar-workspace-indicator">
            <span />
          </div>

          <div>
            <strong>Monitoring enabled</strong>
            <span>Automated checks are running</span>
          </div>
        </div>

        <nav
          className="sidebar-navigation"
          aria-label="Main navigation"
        >
          <div className="sidebar-navigation-group">
            <p className="sidebar-section-label">
              Monitoring
            </p>

            {navigationItems.map((item) => (
              <SidebarNavigationLink
                key={item.path}
                item={item}
                closeSidebar={closeSidebar}
              />
            ))}
          </div>

          <div className="sidebar-navigation-group">
            <p className="sidebar-section-label">
              Account
            </p>

            {accountNavigationItems.map(
              (item) => (
                <SidebarNavigationLink
                  key={item.path}
                  item={item}
                  closeSidebar={closeSidebar}
                />
              ),
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className="sidebar-footer-account"
            onClick={closeSidebar}
          >
            <span className="sidebar-footer-avatar">
              {userInitial}
            </span>

            <span className="sidebar-footer-account-details">
              <strong>
                {user?.full_name || "SiteCare User"}
              </strong>

              <small>
                {user?.email || "Account"}
              </small>
            </span>
          </NavLink>

          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
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
              <Menu size={21} />
            </button>

            <div className="header-title">
              <h1>{pageInformation.title}</h1>
              <p>{pageInformation.description}</p>
            </div>
          </div>

          <div className="header-actions">
            <NotificationCenter />

            <NavLink
              to="/profile"
              aria-label="Open profile"
              className={({ isActive }) =>
                isActive
                  ? "header-profile header-profile-active"
                  : "header-profile"
              }
            >
              <span className="header-profile-avatar">
                {userInitial}
              </span>

              <span className="header-profile-details">
                <strong>
                  {user?.full_name || "SiteCare User"}
                </strong>

                <small>
                  {user?.email || "Account"}
                </small>
              </span>
            </NavLink>
          </div>
        </header>

        <main className="app-main">
          <div className="app-main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}