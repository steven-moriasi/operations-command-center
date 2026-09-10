import { randomUUID } from "node:crypto";

import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { z } from "zod";

import type { CommandCenterConfig } from "../config";
import type {
  AuditEvent,
  ExecutionActionRequest,
  ExecutionActionResult,
  ExecutionDetail,
  ExecutionSummary,
  OperationalSignal,
  WorkflowSummary,
} from "../domain";
import { buildDashboard } from "../services/dashboard";
import {
  executionActionFingerprint,
  nextExecutionState,
} from "../services/execution-actions";
import {
  ExecutionNotFoundError,
  IdempotencyConflictError,
  VersionConflictError,
} from "./errors";
import type { OperationsRepository } from "./operations";

interface ExecutionRow extends QueryResultRow {
  finished_at: Date | null;
  id: string;
  started_at: Date;
  status: ExecutionSummary["status"];
  tenant_id: string;
  version: number;
  workflow_id: string;
  workflow_name: string;
}

interface ExecutionDetailRow extends ExecutionRow {
  attempt: number;
  failure_reason: string | null;
}

interface IdempotencyRow extends QueryResultRow {
  request_fingerprint: string;
  response: unknown;
}

interface AuditEventRow extends QueryResultRow {
  action: string;
  actor_subject: string;
  correlation_id: string;
  created_at: Date;
  details: Record<string, string | number>;
  id: string;
  resource_id: string;
  resource_type: string;
  tenant_id: string;
}

interface SignalRow extends QueryResultRow {
  detail: string;
  id: string;
  level: OperationalSignal["level"];
  title: string;
}

interface WorkflowRow extends QueryResultRow {
  id: string;
  name: string;
  owner: string;
  schedule: string | null;
  tenant_id: string;
}

function mapExecution(row: ExecutionRow): ExecutionSummary {
  return {
    finishedAt: row.finished_at?.toISOString() ?? null,
    id: row.id,
    startedAt: row.started_at.toISOString(),
    status: row.status,
    tenantId: row.tenant_id,
    version: row.version,
    workflowId: row.workflow_id,
    workflowName: row.workflow_name,
  };
}

function mapExecutionDetail(row: ExecutionDetailRow): ExecutionDetail {
  return {
    ...mapExecution(row),
    attempt: row.attempt,
    failureReason: row.failure_reason,
  };
}

function mapSignal(row: SignalRow): OperationalSignal {
  return {
    detail: row.detail,
    id: row.id,
    level: row.level,
    title: row.title,
  };
}

function mapWorkflow(row: WorkflowRow): WorkflowSummary {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    schedule: row.schedule,
    tenantId: row.tenant_id,
  };
}

export class PostgresOperationsRepository implements OperationsRepository {
  private readonly pool: Pool;

  constructor(configuration: CommandCenterConfig) {
    if (configuration.databaseUrl === undefined) {
      throw new Error("Database URL is required for PostgreSQL");
    }

    this.pool = new Pool({
      connectionString: configuration.databaseUrl,
      max: configuration.databaseMaxConnections,
    });
  }

  async actOnExecution(
    request: ExecutionActionRequest,
  ): Promise<ExecutionActionResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [`${request.tenantId}:${request.idempotencyKey}`],
      );
      const fingerprint = executionActionFingerprint(request);
      const replay = await client.query<IdempotencyRow>(
        `SELECT request_fingerprint, response
           FROM execution_action_requests
          WHERE tenant_id = $1 AND idempotency_key = $2`,
        [request.tenantId, request.idempotencyKey],
      );
      if (replay.rowCount === 1) {
        const existing = replay.rows[0];
        if (existing.request_fingerprint !== fingerprint) {
          throw new IdempotencyConflictError(
            "Idempotency key was reused for a different request",
          );
        }
        const result = actionResultSchema.parse(existing.response);
        await client.query("COMMIT");
        return { ...result, replayed: true };
      }

      const executionResult = await client.query<ExecutionDetailRow>(
        `SELECT executions.id,
                executions.attempt,
                executions.failure_reason,
                executions.finished_at,
                executions.started_at,
                executions.status,
                executions.tenant_id,
                executions.version,
                executions.workflow_id,
                workflows.name AS workflow_name
           FROM executions
           JOIN workflows ON workflows.id = executions.workflow_id
          WHERE executions.tenant_id = $1 AND executions.id = $2
          FOR UPDATE`,
        [request.tenantId, request.executionId],
      );
      if (executionResult.rowCount !== 1) {
        throw new ExecutionNotFoundError("Execution was not found");
      }
      const execution = mapExecutionDetail(executionResult.rows[0]);
      if (execution.version !== request.expectedVersion) {
        throw new VersionConflictError("Execution version does not match");
      }

      const nextState = nextExecutionState(execution, request.action);
      const updateResult = await client.query<ExecutionDetailRow>(
        `UPDATE executions
            SET attempt = $3,
                failure_reason = $4,
                finished_at = $5,
                status = $6,
                updated_at = now(),
                version = version + 1
          WHERE tenant_id = $1 AND id = $2
      RETURNING id,
                attempt,
                failure_reason,
                finished_at,
                started_at,
                status,
                tenant_id,
                version,
                workflow_id,
                (SELECT name FROM workflows WHERE workflows.id = workflow_id)
                    AS workflow_name`,
        [
          request.tenantId,
          request.executionId,
          nextState.attempt,
          nextState.failureReason,
          nextState.finishedAt,
          nextState.status,
        ],
      );
      const updatedExecution = mapExecutionDetail(updateResult.rows[0]);
      const auditEventId = randomUUID();
      await insertAuditEvent(client, request, updatedExecution, auditEventId);
      const result: ExecutionActionResult = {
        action: request.action,
        auditEventId,
        execution: updatedExecution,
        replayed: false,
      };
      await client.query(
        `INSERT INTO execution_action_requests (
             tenant_id,
             idempotency_key,
             request_fingerprint,
             response
         ) VALUES ($1, $2, $3, $4::jsonb)`,
        [
          request.tenantId,
          request.idempotencyKey,
          fingerprint,
          JSON.stringify(result),
        ],
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getDashboard(tenantId: string) {
    const [executionResult, signalResult, workflowResult] = await Promise.all([
      this.pool.query<ExecutionRow>(
        `SELECT executions.id,
                executions.finished_at,
                executions.started_at,
                executions.status,
                executions.tenant_id,
                executions.version,
                executions.workflow_id,
                workflows.name AS workflow_name
           FROM executions
           JOIN workflows ON workflows.id = executions.workflow_id
          WHERE executions.tenant_id = $1
          ORDER BY executions.started_at DESC
          LIMIT 20`,
        [tenantId],
      ),
      this.pool.query<SignalRow>(
        `SELECT id, detail, level, title
           FROM operational_signals
          WHERE tenant_id = $1 AND active = true
          ORDER BY created_at DESC`,
        [tenantId],
      ),
      this.pool.query<WorkflowRow>(
        `SELECT id, name, owner, schedule, tenant_id
           FROM workflows
          WHERE tenant_id = $1 AND active = true
          ORDER BY name`,
        [tenantId],
      ),
    ]);

    return buildDashboard({
      executions: executionResult.rows.map(mapExecution),
      generatedAt: new Date().toISOString(),
      signals: signalResult.rows.map(mapSignal),
      source: "database",
      workflows: workflowResult.rows.map(mapWorkflow),
    });
  }

  async ready(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  async getExecution(
    tenantId: string,
    executionId: string,
  ): Promise<ExecutionDetail | null> {
    const result = await this.pool.query<ExecutionDetailRow>(
      `SELECT executions.id,
              executions.attempt,
              executions.failure_reason,
              executions.finished_at,
              executions.started_at,
              executions.status,
              executions.tenant_id,
              executions.version,
              executions.workflow_id,
              workflows.name AS workflow_name
         FROM executions
         JOIN workflows ON workflows.id = executions.workflow_id
        WHERE executions.tenant_id = $1 AND executions.id = $2`,
      [tenantId, executionId],
    );
    return result.rowCount === 1
      ? mapExecutionDetail(result.rows[0])
      : null;
  }

  async listAuditEvents(
    tenantId: string,
    limit: number,
  ): Promise<AuditEvent[]> {
    const result = await this.pool.query<AuditEventRow>(
      `SELECT id,
              tenant_id,
              actor_subject,
              action,
              resource_type,
              resource_id,
              correlation_id,
              details,
              created_at
         FROM audit_events
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [tenantId, limit],
    );
    return result.rows.map((row) => ({
      action: row.action,
      actorSubject: row.actor_subject,
      correlationId: row.correlation_id,
      createdAt: row.created_at.toISOString(),
      details: row.details,
      id: row.id,
      resourceId: row.resource_id,
      resourceType: row.resource_type,
      tenantId: row.tenant_id,
    }));
  }
}

const actionResultSchema: z.ZodType<ExecutionActionResult> = z.object({
  action: z.enum(["cancel", "retry"]),
  auditEventId: z.string().min(1),
  execution: z.object({
    attempt: z.number().int().positive(),
    failureReason: z.string().nullable(),
    finishedAt: z.string().nullable(),
    id: z.string(),
    startedAt: z.string(),
    status: z.enum(["queued", "running", "succeeded", "failed", "cancelled"]),
    tenantId: z.string(),
    version: z.number().int().positive(),
    workflowId: z.string(),
    workflowName: z.string(),
  }),
  replayed: z.boolean(),
});

async function insertAuditEvent(
  client: PoolClient,
  request: ExecutionActionRequest,
  execution: ExecutionDetail,
  auditEventId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (
         id,
         tenant_id,
         actor_subject,
         action,
         resource_type,
         resource_id,
         correlation_id,
         details
     ) VALUES ($1, $2, $3, $4, 'execution', $5, $6, $7::jsonb)`,
    [
      auditEventId,
      request.tenantId,
      request.actorSubject,
      `execution.${request.action}`,
      request.executionId,
      request.correlationId,
      JSON.stringify({
        attempt: execution.attempt,
        status: execution.status,
        version: execution.version,
      }),
    ],
  );
}
