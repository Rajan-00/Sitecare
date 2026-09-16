export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  description: string;
  details_json: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogQuery {
  limit?: number;
  offset?: number;
  action?: string;
}