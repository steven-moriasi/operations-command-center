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
