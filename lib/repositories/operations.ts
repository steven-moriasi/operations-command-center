import type {
  AuditEvent,
  DashboardSnapshot,
  ExecutionActionRequest,
  ExecutionActionResult,
  ExecutionDetail,
} from "../domain";

export interface OperationsRepository {
  actOnExecution(
    request: ExecutionActionRequest,
  ): Promise<ExecutionActionResult>;
  getDashboard(tenantId: string): Promise<DashboardSnapshot>;
  getExecution(
    tenantId: string,
    executionId: string,
  ): Promise<ExecutionDetail | null>;
  listAuditEvents(tenantId: string, limit: number): Promise<AuditEvent[]>;
  ready(): Promise<void>;
}
