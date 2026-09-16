import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AddWebsitePage } from "./pages/AddWebsitePage";
import { AIInsightsPage } from "./pages/AIInsightsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditWebsitePage } from "./pages/EditWebsitePage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { LoginPage } from "./pages/LoginPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WebsiteDetailPage } from "./pages/WebsiteDetailPage";
import ProfilePage from "./pages/ProfilePage";
import ActivityPage from "./pages/ActivityPage";

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
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route element={<ProtectedLayout />}>
            <Route
              path="/"
              element={<DashboardPage />}
            />

            <Route
              path="/websites/new"
              element={<AddWebsitePage />}
            />

            <Route
              path="/websites/:websiteId"
              element={<WebsiteDetailPage />}
            />

            <Route
              path="/websites/:websiteId/edit"
              element={<EditWebsitePage />}
            />

            <Route
              path="/incidents"
              element={<IncidentsPage />}
            />

            <Route
              path="/ai-insights"
              element={<AIInsightsPage />}
            />

            <Route
              path="/maintenance"
              element={<MaintenancePage />}
            />

            <Route
              path="/analytics"
              element={<AnalyticsPage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />
          </Route>

          <Route
            path="*"
            element={<Navigate replace to="/" />}
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;