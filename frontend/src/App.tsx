import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { AddWebsitePage } from "./pages/AddWebsitePage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditWebsitePage } from "./pages/EditWebsitePage";
import { WebsiteDetailPage } from "./pages/WebsiteDetailPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { AIInsightsPage } from "./pages/AIInsightsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />

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
            path="*"
            element={<Navigate replace to="/" />}
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




        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;