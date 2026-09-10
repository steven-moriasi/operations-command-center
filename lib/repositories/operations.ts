import type { DashboardSnapshot } from "../domain";

export interface OperationsRepository {
  getDashboard(tenantId: string): Promise<DashboardSnapshot>;
  ready(): Promise<void>;
}
