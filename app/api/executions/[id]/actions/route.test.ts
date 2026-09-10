import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const actOnExecution = vi.hoisted(() => vi.fn());

vi.mock("../../../../../lib/repositories/factory", () => ({
  getOperationsRepository: () => ({ actOnExecution }),
}));

vi.mock("../../../../../lib/observability/logging", () => ({
  logOperation: vi.fn(),
}));

import { VersionConflictError } from "../../../../../lib/repositories/errors";
import { POST } from "./route";

function request(body: object, idempotencyKey = "action-key"): NextRequest {
  return new NextRequest("http://localhost/api/executions/run-1/actions", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      "x-correlation-id": "correlation-1",
    },
    method: "POST",
  });
}

describe("POST /api/executions/:id/actions", () => {
  it("applies an authorized workflow action", async () => {
    actOnExecution.mockResolvedValueOnce({
      action: "retry",
      auditEventId: "audit-1",
      execution: {
        attempt: 2,
        failureReason: null,
        finishedAt: null,
        id: "run-1",
        startedAt: "2026-09-09T11:00:00.000Z",
        status: "queued",
        tenantId: "astra-demo",
        version: 2,
        workflowId: "workflow-1",
        workflowName: "Supplier intake",
      },
      replayed: false,
    });

    const response = await POST(
      request({ action: "retry", expectedVersion: 1 }),
      { params: Promise.resolve({ id: "run-1" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-correlation-id")).toBe("correlation-1");
    expect(actOnExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        actorSubject: "fixture-platform-operator",
        executionId: "run-1",
        tenantId: "astra-demo",
      }),
    );
  });

  it("rejects missing idempotency and stale versions", async () => {
    const invalid = await POST(
      request({ action: "retry", expectedVersion: 1 }, ""),
      { params: Promise.resolve({ id: "run-1" }) },
    );
    expect(invalid.status).toBe(400);

    actOnExecution.mockRejectedValueOnce(
      new VersionConflictError("Execution version does not match"),
    );
    const conflict = await POST(
      request({ action: "retry", expectedVersion: 1 }),
      { params: Promise.resolve({ id: "run-1" }) },
    );
    expect(conflict.status).toBe(409);
  });
});
