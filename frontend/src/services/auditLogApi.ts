import type {
  AuditLogListResponse,
  AuditLogQuery,
} from "../types/auditLog";
import { apiRequest } from "./api";

export function getAuditLogs(
  query: AuditLogQuery = {},
): Promise<AuditLogListResponse> {
  const parameters = new URLSearchParams();

  parameters.set(
    "limit",
    String(query.limit ?? 10),
  );

  parameters.set(
    "offset",
    String(query.offset ?? 0),
  );

  if (query.action) {
    parameters.set(
      "action",
      query.action,
    );
  }

  return apiRequest<AuditLogListResponse>(
    `/audit-logs?${parameters.toString()}`,
  );
}