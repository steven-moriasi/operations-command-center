import { afterEach, describe, expect, it } from "vitest";

import {
  recordExecutionAction,
  renderMetrics,
  resetMetrics,
} from "./metrics";

describe("metrics", () => {
  afterEach(() => {
    resetMetrics();
  });

  it("renders health and workflow action counters", () => {
    recordExecutionAction("retry", "applied");
    recordExecutionAction("retry", "applied");

    const metrics = renderMetrics();

    expect(metrics).toContain("command_center_up 1");
    expect(metrics).toContain(
      'command_center_execution_actions_total{action="retry",outcome="applied"} 2',
    );
  });
});
