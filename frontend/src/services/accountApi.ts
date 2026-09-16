import type {
  AccountProfile,
  AccountStatistics,
  MessageResponse,
  PasswordChange,
  ProfileUpdate,
} from "../types/account";
import { apiRequest } from "./api";

export function getAccountProfile():
Promise<AccountProfile> {
  return apiRequest<AccountProfile>(
    "/account/profile",
  );
}

export function updateAccountProfile(
  payload: ProfileUpdate,
): Promise<AccountProfile> {
  return apiRequest<AccountProfile>(
    "/account/profile",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function changeAccountPassword(
  payload: PasswordChange,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    "/account/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getAccountStatistics():
Promise<AccountStatistics> {
  return apiRequest<AccountStatistics>(
    "/account/statistics",
  );
}