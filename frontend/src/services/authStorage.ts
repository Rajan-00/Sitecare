const TOKEN_KEY = "sitecare_access_token";

export const AUTH_UNAUTHORIZED_EVENT =
  "sitecare:unauthorized";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function notifyUnauthorized(): void {
  removeStoredToken();

  window.dispatchEvent(
    new Event(AUTH_UNAUTHORIZED_EVENT),
  );
}