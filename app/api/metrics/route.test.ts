import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/metrics", () => {
  it("serves Prometheus-compatible process metrics", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toContain("command_center_up 1");
  });
});
