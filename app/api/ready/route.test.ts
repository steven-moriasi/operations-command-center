import { describe, expect, it, vi } from "vitest";

const ready = vi.fn<() => Promise<void>>();

vi.mock("../../../lib/repositories/factory", () => ({
  getOperationsRepository: () => ({ ready }),
}));

import { GET } from "./route";

describe("GET /api/ready", () => {
  it("reports readiness when the repository is available", async () => {
    ready.mockResolvedValueOnce();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ready" });
  });

  it("returns 503 when the repository is unavailable", async () => {
    ready.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "not_ready" });
  });
});
