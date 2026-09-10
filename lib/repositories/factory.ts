import { loadConfig, type CommandCenterConfig } from "../config";
import { FixtureOperationsRepository } from "./fixture";
import type { OperationsRepository } from "./operations";
import { PostgresOperationsRepository } from "./postgres";

let repository: OperationsRepository | undefined;

export function createOperationsRepository(
  configuration: CommandCenterConfig,
): OperationsRepository {
  return configuration.dataMode === "postgres"
    ? new PostgresOperationsRepository(configuration)
    : new FixtureOperationsRepository();
}

export function getOperationsRepository(): OperationsRepository {
  repository ??= createOperationsRepository(loadConfig());
  return repository;
}
