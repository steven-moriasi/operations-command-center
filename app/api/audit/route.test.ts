import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const listAuditEvents = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/repositories/factory", () => ({
  getOperationsRepository: () => ({ listAuditEvents }),
}));

import { GET } from "./route";

describe("GET /api/audit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns tenant-scoped audit records", async () => {
    listAuditEvents.mockResolvedValueOnce([
      {
        action: "execution.retry",
        actorSubject: "fixture-platform-operator",
        correlationId: "correlation-1",
        createdAt: "2026-09-09T12:00:00.000Z",
        details: { status: "queued", version: 4 },
        id: "audit-1",
        resourceId: "run-1",
        resourceType: "execution",
        tenantId: "astra-demo",
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/audit?limit=5"),
    );

    expect(response.status).toBe(200);
    expect(listAuditEvents).toHaveBeenCalledWith("astra-demo", 5);
    await expect(response.json()).resolves.toHaveLength(1);
  });

  it("rejects invalid limits", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/audit?limit=1000"),
    );

    expect(response.status).toBe(400);
  });

  it("requires authentication in OIDC mode", async () => {
    vi.stubEnv("COMMAND_CENTER_AUTH_MODE", "oidc");
    vi.stubEnv("COMMAND_CENTER_OIDC_AUDIENCE", "identity-gateway");
    vi.stubEnv("COMMAND_CENTER_OIDC_CLIENT_ID", "command-center");
    vi.stubEnv(
      "COMMAND_CENTER_OIDC_ISSUER",
      "http://identity.test/realms/enterprise",
    );
    vi.stubEnv("COMMAND_CENTER_SESSION_SECRET", "a".repeat(32));

    const response = await GET(new NextRequest("http://localhost/api/audit"));

    expect(response.status).toBe(401);
  });
});
