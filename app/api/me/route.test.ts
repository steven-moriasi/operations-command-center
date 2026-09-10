import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/me", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the fixture principal", async () => {
    const response = await GET(new NextRequest("http://localhost/api/me"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      clientId: "command-center",
      tenantId: "astra-demo",
    });
  });

  it("requires a session in OIDC mode", async () => {
    vi.stubEnv("COMMAND_CENTER_AUTH_MODE", "oidc");
    vi.stubEnv("COMMAND_CENTER_OIDC_AUDIENCE", "command-center");
    vi.stubEnv("COMMAND_CENTER_OIDC_CLIENT_ID", "command-center");
    vi.stubEnv(
      "COMMAND_CENTER_OIDC_ISSUER",
      "http://identity.local/realms/astra",
    );
    vi.stubEnv(
      "COMMAND_CENTER_SESSION_SECRET",
      "test-secret-with-at-least-thirty-two-characters",
    );

    const response = await GET(new NextRequest("http://localhost/api/me"));

    expect(response.status).toBe(401);
  });
});
