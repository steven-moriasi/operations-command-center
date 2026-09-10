import { afterEach, describe, expect, it, vi } from "vitest";

import { logOperation } from "./logging";

describe("logOperation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes structured informational and error records", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logOperation("info", {
      correlationId: "correlation-1",
      outcome: "accepted",
    });
    logOperation("error", {
      correlationId: "correlation-2",
      outcome: "rejected",
    });

    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"correlationId":"correlation-1"'),
    );
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('"level":"error"'),
    );
  });
});
