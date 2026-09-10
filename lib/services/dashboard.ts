import type { DashboardSnapshot, ExecutionSummary } from "../domain";
import {
  fixtureExecutions,
  fixtureGeneratedAt,
  fixtureSignals,
  fixtureWorkflows,
} from "../data/fixture-store";
import type { OperationalSignal, WorkflowSummary } from "../domain";

function calculateSuccessRate(executions: ExecutionSummary[]): number {
  const completed = executions.filter(({ status }) =>
    ["succeeded", "failed", "cancelled"].includes(status),
  );
  const succeeded = completed.filter(
    ({ status }) => status === "succeeded",
  ).length;

  return completed.length === 0
    ? 0
    : Math.round((succeeded / completed.length) * 1000) / 10;
}

export function getFixtureDashboard(): DashboardSnapshot {
  return buildDashboard({
    executions: fixtureExecutions,
    generatedAt: fixtureGeneratedAt,
    signals: fixtureSignals,
    source: "fixture",
    workflows: fixtureWorkflows,
  });
}

export function buildDashboard(input: {
  executions: ExecutionSummary[];
  generatedAt: string;
  signals: OperationalSignal[];
  source: DashboardSnapshot["source"];
  workflows: WorkflowSummary[];
}): DashboardSnapshot {
  return {
    executions: input.executions,
    generatedAt: input.generatedAt,
    metrics: {
      activeWorkflows: input.workflows.length,
      failedExecutions: input.executions.filter(
        ({ status }) => status === "failed",
      ).length,
      runningExecutions: input.executions.filter(
        ({ status }) => status === "running",
      ).length,
      successRate: calculateSuccessRate(input.executions),
    },
    signals: input.signals,
    source: input.source,
  };
}
