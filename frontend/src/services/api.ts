import type {
  DashboardSummary,
  WebsiteMetric,
} from "../types/dashboard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api/v1";

async function fetchJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
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
      // The server did not return JSON.
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