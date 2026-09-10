import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/auth/login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns to the fixture dashboard when OIDC is disabled", () => {
    const response = GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?auth=fixture",
    );
  });

  it("redirects OIDC users with transient PKCE cookies", () => {
    vi.stubEnv("COMMAND_CENTER_AUTH_MODE", "oidc");
    vi.stubEnv("COMMAND_CENTER_BASE_URL", "http://localhost:3000");
    vi.stubEnv("COMMAND_CENTER_OIDC_AUDIENCE", "identity-gateway");
    vi.stubEnv("COMMAND_CENTER_OIDC_CLIENT_ID", "command-center");
    vi.stubEnv(
      "COMMAND_CENTER_OIDC_ISSUER",
      "http://identity.test/realms/enterprise",
    );
    vi.stubEnv("COMMAND_CENTER_SESSION_SECRET", "a".repeat(32));

    const response = GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/protocol/openid-connect/auth",
    );
    expect(response.cookies.get("command_center_oidc_state")?.value).toBeTruthy();
    expect(response.cookies.get("command_center_oidc_nonce")?.value).toBeTruthy();
    expect(
      response.cookies.get("command_center_oidc_verifier")?.value,
    ).toBeTruthy();
  });
});
