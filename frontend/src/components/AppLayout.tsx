import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  BrainCircuit,

  CircleUserRound,
  LayoutDashboard,
  PlusCircle,
  Settings,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import {
  Link,
  NavLink,
} from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

function getNavigationClass({
  isActive,
}: {
  isActive: boolean;
}): string {
  if (isActive) {
    return "navigation-item navigation-item--active";
  }

  return "navigation-item";
}

export function AppLayout({
  children,
}: AppLayoutProps) {
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

          <a
            className="navigation-item"
            href="#websites"
          >
            <Activity size={19} />
            Websites
          </a>

         <NavLink
  className={getNavigationClass}
  to="/ai-insights"
>
  <BrainCircuit size={19} />
  AI Insights
</NavLink>

          <span
            className="
              navigation-item
              navigation-item--disabled
            "
            title="AI insights will be added in a future phase."
          >
            <BrainCircuit size={19} />
            AI Insights
          </span>

          <p
            className="
              sidebar__label
              sidebar__label--second
            "
          >
            System
          </p>

          <span
            className="
              navigation-item
              navigation-item--disabled
            "
            title="Settings will be added in a future phase."
          >
            <Settings size={19} />
            Settings
          </span>
        </nav>

        <div className="sidebar__footer">
          <div className="user-avatar">RR</div>

          <div>
            <strong>Rajan Rawal</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">
              Monitoring workspace
            </p>

            <h1>Website health dashboard</h1>
          </div>

          <div className="topbar__actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <button
              className="profile-button"
              type="button"
              aria-label="User profile"
              title="User profile"
            >
              <CircleUserRound size={21} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}