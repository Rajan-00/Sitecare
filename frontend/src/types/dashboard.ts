export interface DashboardSummary {
  total_websites: number;
  active_websites: number;
  websites_up: number;
  websites_down: number;
  websites_not_checked: number;
  total_checks: number;
  total_incidents: number;
  overall_uptime_percentage: number;
  average_response_time_ms: number | null;
}

export type WebsiteStatus =
  | "up"
  | "down"
  | "not_checked";

export interface Website {
  id: number;
  name: string;
  url: string;
  check_interval_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface WebsiteCreate {
  name: string;
  url: string;
  check_interval_minutes: number;
}

export interface WebsiteUpdate {
  name?: string;
  url?: string;
  check_interval_minutes?: number;
  is_active?: boolean;
}

export interface MonitorCheck {
  id: number;
  website_id: number;
  status_code: number | null;
  response_time_ms: number | null;
  is_up: boolean;
  error_message: string | null;
  checked_url: string;
  checked_at: string;
}

export interface WebsiteStatusResponse {
  website_id: number;
  website_name: string;
  website_url: string;
  current_status: WebsiteStatus;
  latest_check: MonitorCheck | null;
}

export interface WebsiteMetric {
  website_id: number;
  website_name: string;
  website_url: string;
  is_active: boolean;
  current_status: WebsiteStatus;
  health_score: number;
  uptime_percentage: number;
  average_response_time_ms: number | null;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  latest_status_code: number | null;
  last_checked_at: string | null;
}