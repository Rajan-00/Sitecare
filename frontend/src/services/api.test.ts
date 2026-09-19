import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { apiRequest } from "./api";
import {
  AUTH_UNAUTHORIZED_EVENT,
  getStoredToken,
  storeToken,
} from "./authStorage";

function mockFetchResponse(
  status: number,
  body: unknown,
) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response);

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

describe("apiRequest", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns JSON from a successful request", async () => {
    mockFetchResponse(200, {
      status: "healthy",
    });

    const response = await apiRequest<{
      status: string;
    }>("/health");

    expect(response).toEqual({
      status: "healthy",
    });
  });

  it("adds the stored JWT to protected requests", async () => {
    storeToken("valid-access-token");

    const fetchMock = mockFetchResponse(
      200,
      {
        total_websites: 0,
      },
    );

    await apiRequest(
      "/dashboard/summary",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestOptions =
      fetchMock.mock.calls[0][1] as RequestInit;

    const headers =
      requestOptions.headers as Headers;

    expect(
      headers.get("Authorization"),
    ).toBe("Bearer valid-access-token");
  });

  it("clears an invalid token after a 401 response", async () => {
    const unauthorizedListener = vi.fn();

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      unauthorizedListener,
    );

    storeToken("expired-access-token");

    mockFetchResponse(401, {
      detail:
        "Could not validate credentials.",
    });

    await expect(
      apiRequest("/dashboard/summary"),
    ).rejects.toThrow(
      "Could not validate credentials.",
    );

    expect(getStoredToken()).toBeNull();

    expect(
      unauthorizedListener,
    ).toHaveBeenCalledTimes(1);

    window.removeEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      unauthorizedListener,
    );
  });

  it("does not announce session expiration for a failed public login", async () => {
    const unauthorizedListener = vi.fn();

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      unauthorizedListener,
    );

    mockFetchResponse(401, {
      detail:
        "Incorrect email or password.",
    });

    await expect(
      apiRequest("/auth/login", {
        method: "POST",
      }),
    ).rejects.toThrow(
      "Incorrect email or password.",
    );

    expect(
      unauthorizedListener,
    ).not.toHaveBeenCalled();

    window.removeEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      unauthorizedListener,
    );
  });
});