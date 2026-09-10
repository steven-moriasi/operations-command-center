import { describe, expect, it } from "vitest";

import {
  ExecutionNotFoundError,
  IdempotencyConflictError,
  InvalidTransitionError,
  VersionConflictError,
} from "./errors";
import { FixtureOperationsRepository } from "./fixture";

describe("FixtureOperationsRepository", () => {
  it("keeps fixture records inside the requested tenant", async () => {
    const repository = new FixtureOperationsRepository();

    await expect(repository.getDashboard("other-tenant")).resolves.toMatchObject(
      {
        executions: [],
        source: "fixture",
      },
    );
    await expect(repository.ready()).resolves.toBeUndefined();
    await expect(
      repository.getExecution("astra-demo", "run-01J7YN"),
    ).resolves.toMatchObject({ id: "run-01J7YN" });
    await expect(
      repository.getExecution("astra-demo", "missing"),
    ).resolves.toBeNull();
  });

  it("applies an idempotent retry with optimistic concurrency", async () => {
    const repository = new FixtureOperationsRepository();
    const request = {
      action: "retry" as const,
      actorSubject: "operator-1",
      correlationId: "correlation-1",
      executionId: "run-01J7YN",
      expectedVersion: 3,
      idempotencyKey: "retry-run-01J7YN",
      tenantId: "astra-demo",
    };

    const result = await repository.actOnExecution(request);
    expect(result).toMatchObject({
      execution: { attempt: 3, status: "queued", version: 4 },
      replayed: false,
    });
    await expect(repository.actOnExecution(request)).resolves.toMatchObject({
      replayed: true,
    });
    await expect(
      repository.listAuditEvents("astra-demo", 1),
    ).resolves.toMatchObject([
      {
        action: "execution.retry",
        actorSubject: "operator-1",
        resourceId: "run-01J7YN",
      },
    ]);
  });

  it("rejects conflicting idempotency keys and stale versions", async () => {
    const repository = new FixtureOperationsRepository();
    const request = {
      action: "retry" as const,
      actorSubject: "operator-1",
      correlationId: "correlation-1",
      executionId: "run-01J7YN",
      expectedVersion: 3,
      idempotencyKey: "retry-run-01J7YN",
      tenantId: "astra-demo",
    };
    await repository.actOnExecution(request);

    await expect(
      repository.actOnExecution({ ...request, action: "cancel" }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    await expect(
      repository.actOnExecution({
        ...request,
        expectedVersion: 3,
        idempotencyKey: "new-request",
      }),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });

  it("rejects missing executions and invalid transitions", async () => {
    const repository = new FixtureOperationsRepository();
    const request = {
      action: "retry" as const,
      actorSubject: "operator-1",
      correlationId: "correlation-1",
      executionId: "missing",
      expectedVersion: 1,
      idempotencyKey: "missing-retry",
      tenantId: "astra-demo",
    };

    await expect(
      repository.actOnExecution(request),
    ).rejects.toBeInstanceOf(ExecutionNotFoundError);
    await expect(
      repository.actOnExecution({
        ...request,
        executionId: "run-01J7YM",
        expectedVersion: 2,
        idempotencyKey: "completed-retry",
      }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });
});
