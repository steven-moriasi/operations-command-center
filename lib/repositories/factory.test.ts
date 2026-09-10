import { describe, expect, it } from "vitest";

import type { CommandCenterConfig } from "../config";
import { createOperationsRepository } from "./factory";
import { FixtureOperationsRepository } from "./fixture";
import { PostgresOperationsRepository } from "./postgres";

const configuration: CommandCenterConfig = {
  authMode: "fixture",
  baseUrl: "http://localhost:3000",
  databaseMaxConnections: 5,
  databaseUrl: "postgresql://example",
  dataMode: "fixture",
  fixtureTenantId: "astra-demo",
};

describe("createOperationsRepository", () => {
  it("selects the configured repository", () => {
    expect(
      createOperationsRepository(configuration),
    ).toBeInstanceOf(FixtureOperationsRepository);
    expect(
      createOperationsRepository({ ...configuration, dataMode: "postgres" }),
    ).toBeInstanceOf(PostgresOperationsRepository);
  });
});
