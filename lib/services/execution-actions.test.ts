import { describe, expect, it } from "vitest";

import type {
  ExecutionActionRequest,
  ExecutionDetail,
} from "../domain";
import { InvalidTransitionError } from "../repositories/errors";
import {
  executionActionFingerprint,
  nextExecutionState,
} from "./execution-actions";

const execution: ExecutionDetail = {
  attempt: 2,
  failureReason: "upstream unavailable",
  finishedAt: "2026-09-09T11:51:18.000Z",
  id: "run-1",
  startedAt: "2026-09-09T11:49:00.000Z",
  status: "failed",
  tenantId: "astra-demo",
  version: 3,
  workflowId: "workflow-1",
  workflowName: "Supplier intake",
};

describe("nextExecutionState", () => {
  it("retries failed executions as a new attempt", () => {
    expect(nextExecutionState(execution, "retry")).toEqual({
      attempt: 3,
      failureReason: null,
      finishedAt: null,
      status: "queued",
    });
  });

  it("cancels active executions without changing the attempt", () => {
    expect(
      nextExecutionState(
        { ...execution, finishedAt: null, status: "running" },
        "cancel",
      ),
    ).toMatchObject({
      attempt: 2,
      failureReason: "upstream unavailable",
      status: "cancelled",
    });
  });

  it("rejects invalid state transitions", () => {
    expect(() =>
      nextExecutionState(
        { ...execution, status: "succeeded" },
        "retry",
      ),
    ).toThrow(InvalidTransitionError);
  });
});

describe("executionActionFingerprint", () => {
  it("binds idempotency to the action, version, tenant, and actor", () => {
    const request: ExecutionActionRequest = {
      action: "retry",
      actorSubject: "operator-1",
      correlationId: "correlation-1",
      executionId: "run-1",
      expectedVersion: 3,
      idempotencyKey: "retry-run-1",
      tenantId: "astra-demo",
    };

    expect(executionActionFingerprint(request)).not.toBe(
      executionActionFingerprint({
        ...request,
        actorSubject: "operator-2",
        correlationId: "correlation-2",
      }),
    );
    expect(executionActionFingerprint(request)).toBe(
      executionActionFingerprint({
        ...request,
        correlationId: "correlation-2",
      }),
    );
  });
});
