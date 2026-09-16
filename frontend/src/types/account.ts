export interface AccountProfile {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface ProfileUpdate {
  full_name: string;
  email: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

export interface AccountStatistics {
  total_websites: number;
  active_websites: number;
  total_health_checks: number;
  total_incidents: number;
  total_activities: number;
  last_activity_at: string | null;
}