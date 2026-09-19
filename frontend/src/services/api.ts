import type {
  AccessTokenResponse,
  AuthUser,
  DashboardSummary,
  Incident,
  MaintenancePrediction,
  MonitorCheck,
  NotificationPreference,
  NotificationPreferenceUpdate,
  RegisterPayload,
  Website,
  WebsiteCreate,
  WebsiteMetric,
  WebsiteStatusResponse,
  WebsiteUpdate,
} from "../types/dashboard";
import { getStoredToken } from "./authStorage";



const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api/v1";

export const API_BASE_URL =
  configuredApiUrl.replace(/\/+$/, "");

  function notifyUnauthorized(): void {
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  headers.set("Accept", "application/json");

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      },
    );
  } catch {
    throw new Error(
      "Unable to connect to the SiteCare API.",
    );
  }

if (!response.ok) {
  if (response.status === 401 && token) {
    notifyUnauthorized();
  }

  let message =
    `Request failed with status ${response.status}.`;

    try {
      const errorData =
        (await response.json()) as ApiErrorResponse;

      message =
        errorData.detail ??
        errorData.message ??
        message;
    } catch {
      // The response did not contain JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getDashboardSummary():
Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(
    "/dashboard/summary",
  );
}

export function getWebsiteMetrics():
Promise<WebsiteMetric[]> {
  return apiRequest<WebsiteMetric[]>(
    "/dashboard/websites",
  );
}

export function getWebsites():
Promise<Website[]> {
  return apiRequest<Website[]>("/websites");
}

export function createWebsite(
  payload: WebsiteCreate,
): Promise<Website> {
  return apiRequest<Website>("/websites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWebsite(
  websiteId: number,
): Promise<Website> {
  return apiRequest<Website>(
    `/websites/${websiteId}`,
  );
}

export function updateWebsite(
  websiteId: number,
  payload: WebsiteUpdate,
): Promise<Website> {
  return apiRequest<Website>(
    `/websites/${websiteId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteWebsite(
  websiteId: number,
): Promise<void> {
  return apiRequest<void>(
    `/websites/${websiteId}`,
    {
      method: "DELETE",
    },
  );
}

export function getWebsiteStatus(
  websiteId: number,
): Promise<WebsiteStatusResponse> {
  return apiRequest<WebsiteStatusResponse>(
    `/monitoring/websites/${websiteId}/status`,
  );
}

export function getWebsiteChecks(
  websiteId: number,
  limit = 50,
): Promise<MonitorCheck[]> {
  return apiRequest<MonitorCheck[]>(
    `/monitoring/websites/${websiteId}/checks?limit=${limit}`,
  );
}

export function runWebsiteCheck(
  websiteId: number,
): Promise<MonitorCheck> {
  return apiRequest<MonitorCheck>(
    `/monitoring/websites/${websiteId}/check`,
    {
      method: "POST",
    },
  );
}

export function getIncidents():
Promise<Incident[]> {
  return apiRequest<Incident[]>(
    "/incidents?limit=100",
  );
}

export function getAnomalies(
  websiteId?: number,
): Promise<MonitorCheck[]> {
  const parameters = new URLSearchParams();

  parameters.set("limit", "100");

  if (websiteId !== undefined) {
    parameters.set(
      "website_id",
      String(websiteId),
    );
  }

  return apiRequest<MonitorCheck[]>(
    `/anomalies?${parameters.toString()}`,
  );
}

export function getMaintenancePredictions():
Promise<MaintenancePrediction[]> {
  return apiRequest<MaintenancePrediction[]>(
    "/predictions/maintenance",
  );
}

export function getWebsiteMaintenancePrediction(
  websiteId: number,
): Promise<MaintenancePrediction> {
  return apiRequest<MaintenancePrediction>(
    `/predictions/maintenance/${websiteId}`,
  );
}

export function getNotificationSettings():
Promise<NotificationPreference> {
  return apiRequest<NotificationPreference>(
    "/notifications/settings",
  );
}

export function updateNotificationSettings(
  payload: NotificationPreferenceUpdate,
): Promise<NotificationPreference> {
  return apiRequest<NotificationPreference>(
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
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/reports/websites/${websiteId}/${format}`,
    {
      headers: {
        Accept:
          format === "pdf"
            ? "application/pdf"
            : "text/csv",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    },
  );

if (!response.ok) {
  if (response.status === 401 && token) {
    notifyUnauthorized();
  }

  let message =
    `Report download failed with status ${response.status}.`;

    try {
      const errorData =
        (await response.json()) as ApiErrorResponse;

      message = errorData.detail ?? message;
    } catch {
      // The report response did not contain JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const downloadUrl =
    window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");

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
  return apiRequest<AuthUser>(
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

  return apiRequest<AccessTokenResponse>(
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
  return apiRequest<AuthUser>("/auth/me");
}