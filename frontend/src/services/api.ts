import { getStoredToken } from "./authStorage";
import type {
  DashboardSummary,
  Incident,
  MaintenancePrediction,
  MonitorCheck,
  Website,
  WebsiteCreate,
  WebsiteMetric,
  WebsiteStatusResponse,
  WebsiteUpdate,
  NotificationPreference,
  NotificationPreferenceUpdate,
  AuthUser,
  AccessTokenResponse,
  RegisterPayload
} from "../types/dashboard";



const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api/v1";

async function fetchJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(
    options?.headers,
  );

  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const token = getStoredToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    },
  );

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}`;

    try {
      const errorData = (
        await response.json()
      ) as {
        detail?: string;
      };

      if (errorData.detail) {
        message = errorData.detail;
      }
    } catch {
      // Response did not contain JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchJson<DashboardSummary>("/dashboard/summary");
}

export function getWebsiteMetrics(): Promise<WebsiteMetric[]> {
  return fetchJson<WebsiteMetric[]>("/dashboard/websites");
}

export function createWebsite(
  payload: WebsiteCreate,
): Promise<Website> {
  return fetchJson<Website>("/websites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWebsite(
  websiteId: number,
): Promise<Website> {
  return fetchJson<Website>(`/websites/${websiteId}`);
}

export function getWebsiteStatus(
  websiteId: number,
): Promise<WebsiteStatusResponse> {
  return fetchJson<WebsiteStatusResponse>(
    `/monitoring/websites/${websiteId}/status`,
  );
}

export function getWebsiteChecks(
  websiteId: number,
  limit = 50,
): Promise<MonitorCheck[]> {
  return fetchJson<MonitorCheck[]>(
    `/monitoring/websites/${websiteId}/checks?limit=${limit}`,
  );
}

export function runWebsiteCheck(
  websiteId: number,
): Promise<MonitorCheck> {
  return fetchJson<MonitorCheck>(
    `/monitoring/websites/${websiteId}/check`,
    {
      method: "POST",
    },
  );
}
export function updateWebsite(
  websiteId: number,
  payload: WebsiteUpdate,
): Promise<Website> {
  return fetchJson<Website>(
    `/websites/${websiteId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteWebsite(
  websiteId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/websites/${websiteId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Delete failed with status ${response.status}`,
    );
  }
}
export function getIncidents(): Promise<Incident[]> {
  return fetchJson<Incident[]>("/incidents?limit=100");
}
export function getAnomalies(
  websiteId?: number,
): Promise<MonitorCheck[]> {
  const query = websiteId
    ? `?website_id=${websiteId}&limit=100`
    : "?limit=100";

  return fetchJson<MonitorCheck[]>(
    `/anomalies${query}`,
  );
}

export function getMaintenancePredictions():
Promise<MaintenancePrediction[]> {
  return fetchJson<MaintenancePrediction[]>(
    "/predictions/maintenance",
  );
}

export function getWebsiteMaintenancePrediction(
  websiteId: number,
): Promise<MaintenancePrediction> {
  return fetchJson<MaintenancePrediction>(
    `/predictions/maintenance/${websiteId}`,
  );
}
export function getNotificationSettings():
Promise<NotificationPreference> {
  return fetchJson<NotificationPreference>(
    "/notifications/settings",
  );
}

export function updateNotificationSettings(
  payload: NotificationPreferenceUpdate,
): Promise<NotificationPreference> {
  return fetchJson<NotificationPreference>(
    "/notifications/settings",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
export type ReportFormat = "pdf" | "csv";

export async function downloadWebsiteReport(
  websiteId: number,
  format: ReportFormat,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/reports/websites/${websiteId}/${format}`,
  );

  if (!response.ok) {
    throw new Error(
      `Report download failed with status ${response.status}`,
    );
  }

  const blob = await response.blob();

  const downloadUrl =
    window.URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download =
    `sitecare-health-report.${format}`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(downloadUrl);
}

export function registerUser(
  payload: RegisterPayload,
): Promise<AuthUser> {
  return fetchJson<AuthUser>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function loginUser(
  email: string,
  password: string,
): Promise<AccessTokenResponse> {
  const formData = new URLSearchParams();

  formData.set("username", email);
  formData.set("password", password);

  return fetchJson<AccessTokenResponse>(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
    },
  );
}

export function getCurrentUser():
Promise<AuthUser> {
  return fetchJson<AuthUser>("/auth/me");
}