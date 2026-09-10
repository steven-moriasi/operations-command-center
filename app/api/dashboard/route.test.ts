import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/dashboard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a typed fixture snapshot", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/dashboard"),
    );
    const body = await response.json();

    expect(body).toMatchObject({
      metrics: {
        activeWorkflows: 4,
        failedExecutions: 1,
        runningExecutions: 1,
        successRate: 66.7,
      },
      source: "fixture",
    });
    expect(body.executions).toHaveLength(4);
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

    const response = await GET(
      new NextRequest("http://localhost/api/dashboard"),
    );

    expect(response.status).toBe(401);
  });
});
