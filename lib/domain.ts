export const executionStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type ExecutionStatus = (typeof executionStatuses)[number];

export interface WorkflowSummary {
  id: string;
  name: string;
  owner: string;
  schedule: string | null;
  tenantId: string;
}

export interface ExecutionSummary {
  finishedAt: string | null;
  id: string;
  startedAt: string;
  status: ExecutionStatus;
  tenantId: string;
  version: number;
  workflowId: string;
  workflowName: string;
}

export type ExecutionAction = "cancel" | "retry";

export interface ExecutionDetail extends ExecutionSummary {
  attempt: number;
  failureReason: string | null;
}

export interface ExecutionActionResult {
  action: ExecutionAction;
  auditEventId: string;
  execution: ExecutionDetail;
  replayed: boolean;
}

export interface ExecutionActionRequest {
  action: ExecutionAction;
  actorSubject: string;
  correlationId: string;
  executionId: string;
  expectedVersion: number;
  idempotencyKey: string;
  tenantId: string;
}

export interface AuditEvent {
  action: string;
  actorSubject: string;
  correlationId: string;
  createdAt: string;
  details: Record<string, string | number>;
  id: string;
  resourceId: string;
  resourceType: string;
  tenantId: string;
}

export interface OperationalSignal {
  detail: string;
  id: string;
  level: "attention" | "healthy";
  title: string;
}

export interface DashboardSnapshot {
  executions: ExecutionSummary[];
  generatedAt: string;
  metrics: {
    activeWorkflows: number;
    failedExecutions: number;
    runningExecutions: number;
    successRate: number;
  };
  signals: OperationalSignal[];
  source: "fixture" | "database";
}
