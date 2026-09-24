import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";

// Load these pages only when their routes are opened.
const AppLayout = lazy(() => import("./components/AppLayout"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const AddWebsitePage = lazy(() =>
  import("./pages/AddWebsitePage").then((module) => ({
    default: module.AddWebsitePage,
  }))
);
const AIInsightsPage = lazy(() =>
  import("./pages/AIInsightsPage").then((module) => ({
    default: module.AIInsightsPage,
  }))
);
const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((module) => ({
    default: module.AnalyticsPage,
  }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  }))
);
const EditWebsitePage = lazy(() =>
  import("./pages/EditWebsitePage").then((module) => ({
    default: module.EditWebsitePage,
  }))
);
const IncidentsPage = lazy(() =>
  import("./pages/IncidentsPage").then((module) => ({
    default: module.IncidentsPage,
  }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  }))
);
const MaintenancePage = lazy(() =>
  import("./pages/MaintenancePage").then((module) => ({
    default: module.MaintenancePage,
  }))
);
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage")
);
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  }))
);
const WebsiteDetailPage = lazy(() =>
  import("./pages/WebsiteDetailPage").then((module) => ({
    default: module.WebsiteDetailPage,
  }))
);
const WebsitesPage = lazy(() =>
  import("./pages/WebsitesPage").then((module) => ({
    default: module.WebsitesPage,
  }))
);

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div role="status">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="websites" element={<WebsitesPage />} />
              <Route path="websites/new" element={<AddWebsitePage />} />
              <Route
                path="websites/:websiteId"
                element={<WebsiteDetailPage />}
              />
              <Route
                path="websites/:websiteId/edit"
                element={<EditWebsitePage />}
              />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="anomalies" element={<AIInsightsPage />} />
              <Route
                path="ai-insights"
                element={<Navigate replace to="/anomalies" />}
              />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="notifications"
                element={<NotificationsPage />}
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;