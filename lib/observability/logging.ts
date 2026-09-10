export function logOperation(
  level: "error" | "info",
  event: {
    action?: string;
    correlationId: string;
    executionId?: string;
    outcome: string;
    subject?: string;
    tenantId?: string;
  },
): void {
  const entry = JSON.stringify({
    ...event,
    level,
    service: "operations-command-center",
    timestamp: new Date().toISOString(),
  });

  if (level === "error") {
    console.error(entry);
  } else {
    console.info(entry);
  }
}
