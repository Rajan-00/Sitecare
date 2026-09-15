import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <strong>SiteCare AI</strong>
            <span>Health Intelligence</span>
          </div>
        </div>

        <nav className="sidebar__navigation">
          <p className="sidebar__label">Workspace</p>

          <a className="navigation-item navigation-item--active" href="/">
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a className="navigation-item" href="#websites">
            <Activity size={19} />
            Websites
          </a>

          <a className="navigation-item" href="#analytics">
            <ChartNoAxesCombined size={19} />
            Analytics
          </a>

          <a className="navigation-item" href="#ai-insights">
            <BrainCircuit size={19} />
            AI Insights
          </a>

          <p className="sidebar__label sidebar__label--second">
            System
          </p>

          <a className="navigation-item" href="#settings">
            <Settings size={19} />
            Settings
          </a>
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
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <button
              className="profile-button"
              type="button"
              aria-label="User profile"
            >
              <CircleUserRound size={21} />
            </button>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}