import { getStoredToken } from "./authStorage";
import type {
  AccountProfile,
  AccountStatistics,
  MessageResponse,
  PasswordChange,
  ProfileUpdate,
} from "../types/account";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

async function accountRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const errorData = (await response.json()) as {
        detail?: string;
      };

      message = errorData.detail ?? message;
    } catch {
      message = `Request failed with status ${response.status}.`;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getAccountProfile(): Promise<AccountProfile> {
  return accountRequest<AccountProfile>("/account/profile");
}

export function updateAccountProfile(
  payload: ProfileUpdate,
): Promise<AccountProfile> {
  return accountRequest<AccountProfile>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changeAccountPassword(
  payload: PasswordChange,
): Promise<MessageResponse> {
  return accountRequest<MessageResponse>("/account/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAccountStatistics(): Promise<AccountStatistics> {
  return accountRequest<AccountStatistics>(
    "/account/statistics",
  );
}