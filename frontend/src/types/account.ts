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