import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const exchangeAuthorizationCode = vi.hoisted(() => vi.fn());
const createSessionToken = vi.hoisted(() => vi.fn());

vi.mock("../../../../lib/auth/oidc", () => ({
  exchangeAuthorizationCode,
}));

vi.mock("../../../../lib/auth/session", () => ({
  createSessionToken,
  sessionCookieName: "command_center_session",
}));

import { GET } from "./route";

describe("GET /api/auth/callback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    exchangeAuthorizationCode.mockReset();
    createSessionToken.mockReset();
  });

  it("rejects callbacks outside OIDC mode", async () => {
    const request = new NextRequest(
      "http://localhost/api/auth/callback?code=code&state=state",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?auth=invalid_callback",
    );
  });

  it("creates a session after a valid OIDC callback", async () => {
    vi.stubEnv("COMMAND_CENTER_AUTH_MODE", "oidc");
    vi.stubEnv("COMMAND_CENTER_BASE_URL", "http://localhost:3000");
    vi.stubEnv("COMMAND_CENTER_OIDC_AUDIENCE", "identity-gateway");
    vi.stubEnv("COMMAND_CENTER_OIDC_CLIENT_ID", "command-center");
    vi.stubEnv(
      "COMMAND_CENTER_OIDC_ISSUER",
      "http://identity.test/realms/enterprise",
    );
    vi.stubEnv("COMMAND_CENTER_SESSION_SECRET", "a".repeat(32));
    exchangeAuthorizationCode.mockResolvedValueOnce({
      clientId: "command-center",
      displayName: "Platform operator",
      email: null,
      roles: ["operations-operator"],
      scopes: ["operations:write"],
      subject: "operator-1",
      tenantId: "astra-demo",
    });
    createSessionToken.mockResolvedValueOnce("signed-session");
    const request = new NextRequest(
      "http://localhost/api/auth/callback?code=code&state=state",
      {
        headers: {
          cookie:
            "command_center_oidc_state=state; command_center_oidc_nonce=nonce; command_center_oidc_verifier=verifier",
        },
      },
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(response.cookies.get("command_center_session")?.value).toBe(
      "signed-session",
    );
    expect(exchangeAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "code",
        expectedNonce: "nonce",
        verifier: "verifier",
      }),
    );
  });

  it("returns to the dashboard when token validation fails", async () => {
    vi.stubEnv("COMMAND_CENTER_AUTH_MODE", "oidc");
    vi.stubEnv("COMMAND_CENTER_BASE_URL", "http://localhost:3000");
    vi.stubEnv("COMMAND_CENTER_OIDC_AUDIENCE", "identity-gateway");
    vi.stubEnv("COMMAND_CENTER_OIDC_CLIENT_ID", "command-center");
    vi.stubEnv(
      "COMMAND_CENTER_OIDC_ISSUER",
      "http://identity.test/realms/enterprise",
    );
    vi.stubEnv("COMMAND_CENTER_SESSION_SECRET", "a".repeat(32));
    exchangeAuthorizationCode.mockRejectedValueOnce(
      new Error("identity unavailable"),
    );
    const request = new NextRequest(
      "http://localhost/api/auth/callback?code=code&state=state",
      {
        headers: {
          cookie:
            "command_center_oidc_state=state; command_center_oidc_nonce=nonce; command_center_oidc_verifier=verifier",
        },
      },
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?auth=failed",
    );
  });
});
