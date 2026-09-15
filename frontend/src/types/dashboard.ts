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

export type WebsiteStatus = "up" | "down" | "not_checked";

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