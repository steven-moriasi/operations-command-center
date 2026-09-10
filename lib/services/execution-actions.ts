import { createHash } from "node:crypto";

import type {
  ExecutionAction,
  ExecutionActionRequest,
  ExecutionDetail,
} from "../domain";
import { InvalidTransitionError } from "../repositories/errors";

export function nextExecutionState(
  execution: ExecutionDetail,
  action: ExecutionAction,
): Pick<
  ExecutionDetail,
  "attempt" | "failureReason" | "finishedAt" | "status"
> {
  if (
    action === "cancel" &&
    (execution.status === "queued" || execution.status === "running")
  ) {
    return {
      attempt: execution.attempt,
      failureReason: execution.failureReason,
      finishedAt: new Date().toISOString(),
      status: "cancelled",
    };
  }

  if (
    action === "retry" &&
    (execution.status === "failed" || execution.status === "cancelled")
  ) {
    return {
      attempt: execution.attempt + 1,
      failureReason: null,
      finishedAt: null,
      status: "queued",
    };
  }

  throw new InvalidTransitionError(
    `Cannot ${action} an execution in ${execution.status} state`,
  );
}

export function executionActionFingerprint(
  request: ExecutionActionRequest,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        action: request.action,
        actorSubject: request.actorSubject,
        executionId: request.executionId,
        expectedVersion: request.expectedVersion,
        tenantId: request.tenantId,
      }),
    )
    .digest("hex");
}
