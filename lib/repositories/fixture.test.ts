import { describe, expect, it } from "vitest";

import { FixtureOperationsRepository } from "./fixture";

describe("FixtureOperationsRepository", () => {
  it("keeps fixture records inside the requested tenant", async () => {
    const repository = new FixtureOperationsRepository();

    await expect(repository.getDashboard("other-tenant")).resolves.toMatchObject(
      {
        executions: [],
        source: "fixture",
      },
    );
    await expect(repository.ready()).resolves.toBeUndefined();
  });
});
