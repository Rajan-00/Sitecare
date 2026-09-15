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




        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;