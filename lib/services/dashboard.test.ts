import { describe, expect, it } from "vitest";

import { buildDashboard, getFixtureDashboard } from "./dashboard";

describe("getFixtureDashboard", () => {
  it("derives metrics from the fixture records", () => {
    const dashboard = getFixtureDashboard();

    expect(dashboard.metrics).toEqual({
      activeWorkflows: 4,
      failedExecutions: 1,
      runningExecutions: 1,
      successRate: 66.7,
    });
    expect(dashboard.generatedAt).toBe("2026-09-09T12:00:00.000Z");
  });

  it("reports a zero success rate without completed executions", () => {
    const dashboard = buildDashboard({
      executions: [],
      generatedAt: "2026-09-09T12:00:00.000Z",
      signals: [],
      source: "database",
      workflows: [],
    });

    expect(dashboard.metrics.successRate).toBe(0);
  });
});
