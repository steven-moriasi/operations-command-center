import { randomUUID } from "node:crypto";

import {
  fixtureExecutions,
  fixtureGeneratedAt,
  fixtureSignals,
  fixtureWorkflows,
} from "../data/fixture-store";
import type {
  AuditEvent,
  ExecutionActionRequest,
  ExecutionActionResult,
  ExecutionDetail,
} from "../domain";
import {
  executionActionFingerprint,
  nextExecutionState,
} from "../services/execution-actions";
import { buildDashboard } from "../services/dashboard";
import {
  ExecutionNotFoundError,
  IdempotencyConflictError,
  VersionConflictError,
} from "./errors";
import type { OperationsRepository } from "./operations";

export class FixtureOperationsRepository implements OperationsRepository {
  private readonly actionResults = new Map<
    string,
    { fingerprint: string; result: ExecutionActionResult }
  >();
  private readonly executions = fixtureExecutions.map((execution) => ({
    ...execution,
  }));
  private readonly auditEvents: AuditEvent[] = [];

  async actOnExecution(
    request: ExecutionActionRequest,
  ): Promise<ExecutionActionResult> {
    const fingerprint = executionActionFingerprint(request);
    const idempotencyKey = `${request.tenantId}:${request.idempotencyKey}`;
    const existing = this.actionResults.get(idempotencyKey);
    if (existing !== undefined) {
      if (existing.fingerprint !== fingerprint) {
        throw new IdempotencyConflictError(
          "Idempotency key was reused for a different request",
        );
      }
      return { ...existing.result, replayed: true };
    }

    const execution = await this.getExecution(
      request.tenantId,
      request.executionId,
    );
    if (execution === null) {
      throw new ExecutionNotFoundError("Execution was not found");
    }
    if (execution.version !== request.expectedVersion) {
      throw new VersionConflictError("Execution version does not match");
    }

    const nextState = nextExecutionState(execution, request.action);
    const storedExecution = this.executions.find(
      ({ id }) => id === request.executionId,
    );
    if (storedExecution === undefined) {
      throw new ExecutionNotFoundError("Execution was not found");
    }
    Object.assign(storedExecution, nextState, {
      version: execution.version + 1,
    });

    const auditEventId = randomUUID();
    const result: ExecutionActionResult = {
      action: request.action,
      auditEventId,
      execution: { ...storedExecution },
      replayed: false,
    };
    this.auditEvents.unshift({
      action: `execution.${request.action}`,
      actorSubject: request.actorSubject,
      correlationId: request.correlationId,
      createdAt: new Date().toISOString(),
      details: {
        attempt: storedExecution.attempt,
        status: storedExecution.status,
        version: storedExecution.version,
      },
      id: auditEventId,
      resourceId: request.executionId,
      resourceType: "execution",
      tenantId: request.tenantId,
    });
    this.actionResults.set(idempotencyKey, { fingerprint, result });
    return result;
  }

  async getDashboard(tenantId: string) {
    const executions = this.executions.filter(
        (execution) => execution.tenantId === tenantId,
      );
    return buildDashboard({
      executions,
      generatedAt: fixtureGeneratedAt,
      signals: fixtureSignals,
      source: "fixture",
      workflows: fixtureWorkflows,
    });
  }

  async getExecution(
    tenantId: string,
    executionId: string,
  ): Promise<ExecutionDetail | null> {
    const execution = this.executions.find(
      ({ id, tenantId: executionTenantId }) =>
        id === executionId && executionTenantId === tenantId,
    );
    return execution === undefined ? null : { ...execution };
  }

  async ready(): Promise<void> {
    return Promise.resolve();
  }

  async listAuditEvents(
    tenantId: string,
    limit: number,
  ): Promise<AuditEvent[]> {
    return this.auditEvents
      .filter((event) => event.tenantId === tenantId)
      .slice(0, limit)
      .map((event) => ({ ...event, details: { ...event.details } }));
  }
}
