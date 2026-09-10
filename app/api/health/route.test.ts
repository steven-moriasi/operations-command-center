import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("reports the service as healthy", async () => {
    const response = GET();

    await expect(response.json()).resolves.toEqual({
      service: "operations-command-center",
      status: "healthy",
    });
    expect(response.status).toBe(200);
  });
});
