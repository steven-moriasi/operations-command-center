import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/dashboard", () => {
  it("returns a typed fixture snapshot", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/dashboard"),
    );
    const body = await response.json();

    expect(body).toMatchObject({
      metrics: {
        activeWorkflows: 4,
        failedExecutions: 1,
        runningExecutions: 1,
        successRate: 66.7,
      },
      source: "fixture",
    });
    expect(body.executions).toHaveLength(4);
  });
});
