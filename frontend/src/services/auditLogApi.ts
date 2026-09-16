import { getStoredToken } from "./authStorage";
import type {
  AuditLogListResponse,
  AuditLogQuery,
} from "../types/auditLog";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export async function getAuditLogs(
  query: AuditLogQuery = {},
): Promise<AuditLogListResponse> {
  const token = getStoredToken();

  const parameters = new URLSearchParams();

  parameters.set("limit", String(query.limit ?? 10));
  parameters.set("offset", String(query.offset ?? 0));

  if (query.action) {
    parameters.set("action", query.action);
  }

  const response = await fetch(
    `${API_BASE_URL}/audit-logs?${parameters.toString()}`,
    {
      headers: {
        Accept: "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    },
  );

  if (!response.ok) {
    let message = "Unable to load activity history.";

    try {
      const data = (await response.json()) as {
        detail?: string;
      };

      message = data.detail ?? message;
    } catch {
      message = `Request failed with status ${response.status}.`;
    }

    throw new Error(message);
  }

  return response.json() as Promise<AuditLogListResponse>;
}