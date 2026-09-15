import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { AddWebsitePage } from "./pages/AddWebsitePage";
import { DashboardPage } from "./pages/DashboardPage";
import { WebsiteDetailPage } from "./pages/WebsiteDetailPage";

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
            path="*"
            element={<Navigate replace to="/" />}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;