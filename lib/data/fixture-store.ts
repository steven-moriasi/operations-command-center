import type {
  ExecutionDetail,
  OperationalSignal,
  WorkflowSummary,
} from "../domain";

export const fixtureGeneratedAt = "2026-09-09T12:00:00.000Z";

export const fixtureWorkflows: WorkflowSummary[] = [
  {
    id: "workflow-finance-reconciliation",
    name: "Finance reconciliation",
    owner: "Finance operations",
    schedule: "0 */4 * * *",
    tenantId: "astra-demo",
  },
  {
    id: "workflow-customer-onboarding",
    name: "Customer onboarding",
    owner: "Customer operations",
    schedule: null,
    tenantId: "astra-demo",
  },
  {
    id: "workflow-supplier-intake",
    name: "Supplier document intake",
    owner: "Procurement operations",
    schedule: "*/15 * * * *",
    tenantId: "astra-demo",
  },
  {
    id: "workflow-access-review",
    name: "Access review export",
    owner: "Identity operations",
    schedule: "0 6 * * 1",
    tenantId: "astra-demo",
  },
];

export const fixtureExecutions: ExecutionDetail[] = [
  {
    attempt: 1,
    failureReason: null,
    finishedAt: "2026-09-09T11:58:20.000Z",
    id: "run-01J7YQ",
    startedAt: "2026-09-09T11:56:00.000Z",
    status: "succeeded",
    tenantId: "astra-demo",
    version: 2,
    workflowId: "workflow-finance-reconciliation",
    workflowName: "Finance reconciliation",
  },
  {
    attempt: 1,
    failureReason: null,
    finishedAt: null,
    id: "run-01J7YP",
    startedAt: "2026-09-09T11:54:00.000Z",
    status: "running",
    tenantId: "astra-demo",
    version: 1,
    workflowId: "workflow-customer-onboarding",
    workflowName: "Customer onboarding",
  },
  {
    attempt: 2,
    failureReason: "Local upstream fixture returned HTTP 429",
    finishedAt: "2026-09-09T11:51:18.000Z",
    id: "run-01J7YN",
    startedAt: "2026-09-09T11:49:00.000Z",
    status: "failed",
    tenantId: "astra-demo",
    version: 3,
    workflowId: "workflow-supplier-intake",
    workflowName: "Supplier document intake",
  },
  {
    attempt: 1,
    failureReason: null,
    finishedAt: "2026-09-09T11:43:41.000Z",
    id: "run-01J7YM",
    startedAt: "2026-09-09T11:42:00.000Z",
    status: "succeeded",
    tenantId: "astra-demo",
    version: 2,
    workflowId: "workflow-access-review",
    workflowName: "Access review export",
  },
];

export const fixtureSignals: OperationalSignal[] = [
  {
    detail: "The local upstream fixture returned 429. Retry is scheduled.",
    id: "signal-supplier-retry",
    level: "attention",
    title: "Supplier intake retrying",
  },
  {
    detail: "1 of 40 fixture execution slots is currently in use.",
    id: "signal-worker-capacity",
    level: "healthy",
    title: "Worker capacity healthy",
  },
  {
    detail: "No fixture audit records are outside the delivery objective.",
    id: "signal-audit-delivery",
    level: "healthy",
    title: "Audit delivery current",
  },
];
