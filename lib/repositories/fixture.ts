import { getFixtureDashboard } from "../services/dashboard";
import type { OperationsRepository } from "./operations";

export class FixtureOperationsRepository implements OperationsRepository {
  async getDashboard(tenantId: string) {
    const dashboard = getFixtureDashboard();

    return {
      ...dashboard,
      executions: dashboard.executions.filter(
        (execution) => execution.tenantId === tenantId,
      ),
    };
  }

  async ready(): Promise<void> {
    return Promise.resolve();
  }
}
