import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AUTH_UNAUTHORIZED_EVENT,
  getStoredToken,
  notifyUnauthorized,
  removeStoredToken,
  storeToken,
} from "./authStorage";

describe("authentication storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and returns an access token", () => {
    storeToken("test-access-token");

    expect(getStoredToken()).toBe(
      "test-access-token",
    );
  });

  it("removes the stored token", () => {
    storeToken("test-access-token");

    removeStoredToken();

    expect(getStoredToken()).toBeNull();
  });

  it("removes the token and announces an unauthorized session", () => {
    const unauthorizedListener = vi.fn();

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      unauthorizedListener,
    );

    storeToken("expired-access-token");

    notifyUnauthorized();

    expect(getStoredToken()).toBeNull();

    expect(
      unauthorizedListener,
    ).toHaveBeenCalledTimes(1);

    window.removeEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      unauthorizedListener,
    );
  });
});

const TOKEN_KEY = "sitecare_access_token";

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}