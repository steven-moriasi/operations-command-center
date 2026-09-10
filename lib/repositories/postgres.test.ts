import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();

vi.mock("pg", () => ({
  Pool: class {
    query = query;
  },
}));

import type { CommandCenterConfig } from "../config";
import { PostgresOperationsRepository } from "./postgres";

const configuration: CommandCenterConfig = {
  authMode: "fixture",
  baseUrl: "http://localhost:3000",
  databaseMaxConnections: 5,
  databaseUrl: "postgresql://example",
  dataMode: "postgres",
  fixtureTenantId: "astra-demo",
};

describe("PostgresOperationsRepository", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("maps database records into a dashboard snapshot", async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          {
            finished_at: new Date("2026-09-09T11:58:20.000Z"),
            id: "run-complete",
            started_at: new Date("2026-09-09T11:56:00.000Z"),
            status: "succeeded",
            tenant_id: "astra-demo",
            version: 2,
            workflow_id: "workflow-1",
            workflow_name: "Finance reconciliation",
          },
          {
            finished_at: null,
            id: "run-active",
            started_at: new Date("2026-09-09T11:59:00.000Z"),
            status: "running",
            tenant_id: "astra-demo",
            version: 1,
            workflow_id: "workflow-1",
            workflow_name: "Finance reconciliation",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            detail: "All adapters are responding.",
            id: "signal-1",
            level: "healthy",
            title: "Adapters healthy",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "workflow-1",
            name: "Finance reconciliation",
            owner: "Finance operations",
            schedule: null,
            tenant_id: "astra-demo",
          },
        ],
      });

    const repository = new PostgresOperationsRepository(configuration);
    const dashboard = await repository.getDashboard("astra-demo");

    expect(dashboard).toMatchObject({
      metrics: {
        activeWorkflows: 1,
        runningExecutions: 1,
        successRate: 100,
      },
      source: "database",
    });
    expect(dashboard.executions).toEqual([
      expect.objectContaining({
        finishedAt: "2026-09-09T11:58:20.000Z",
        id: "run-complete",
      }),
      expect.objectContaining({ finishedAt: null, id: "run-active" }),
    ]);
    expect(dashboard.signals).toEqual([
      {
        detail: "All adapters are responding.",
        id: "signal-1",
        level: "healthy",
        title: "Adapters healthy",
      },
    ]);
  });

  it("checks the database connection for readiness", async () => {
    query.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    const repository = new PostgresOperationsRepository(configuration);

    await expect(repository.ready()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("rejects a missing database URL", () => {
    expect(
      () =>
        new PostgresOperationsRepository({
          ...configuration,
          databaseUrl: undefined,
        }),
    ).toThrow("Database URL is required");
  });
});
