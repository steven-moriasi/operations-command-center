import { Pool, type QueryResultRow } from "pg";

import type { CommandCenterConfig } from "../config";
import type {
  ExecutionSummary,
  OperationalSignal,
  WorkflowSummary,
} from "../domain";
import { buildDashboard } from "../services/dashboard";
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
}
