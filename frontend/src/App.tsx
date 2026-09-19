import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import ActivityPage from "./pages/ActivityPage";
import { AddWebsitePage } from "./pages/AddWebsitePage";
import { AIInsightsPage } from "./pages/AIInsightsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditWebsitePage } from "./pages/EditWebsitePage";
import { IncidentsPage } from "./pages/IncidentsPage";
import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import NotFoundPage from "./pages/NotFoundPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WebsiteDetailPage } from "./pages/WebsiteDetailPage";
import { WebsitesPage } from "./pages/WebsitesPage";

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
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          {/* Authenticated application */}
          <Route element={<ProtectedLayout />}>
            <Route
              path="dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="websites"
              element={<WebsitesPage />}
            />

            <Route
              path="websites/new"
              element={<AddWebsitePage />}
            />

            <Route
              path="websites/:websiteId"
              element={<WebsiteDetailPage />}
            />

            <Route
              path="websites/:websiteId/edit"
              element={<EditWebsitePage />}
            />

            <Route
              path="incidents"
              element={<IncidentsPage />}
            />

            <Route
              path="anomalies"
              element={<AIInsightsPage />}
            />

            <Route
              path="ai-insights"
              element={
                <Navigate
                  replace
                  to="/anomalies"
                />
              }
            />

            <Route
              path="maintenance"
              element={<MaintenancePage />}
            />

            <Route
              path="analytics"
              element={<AnalyticsPage />}
            />

            <Route
              path="settings"
              element={<SettingsPage />}
            />

            <Route
              path="activity"
              element={<ActivityPage />}
            />

            <Route
              path="profile"
              element={<ProfilePage />}
            />

            <Route
              path="notifications"
              element={<NotificationsPage />}
            />
          </Route>

          {/* Public 404 page */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;