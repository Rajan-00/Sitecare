import type {
  DashboardSummary,
  MonitorCheck,
  Website,
  WebsiteCreate,
  WebsiteMetric,
  WebsiteStatusResponse,
} from "../types/dashboard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api/v1";

async function fetchJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = (await response.json()) as {
        detail?: string;
      };

      if (errorData.detail) {
        message = errorData.detail;
      }
    } catch {
      // The response did not contain JSON.
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