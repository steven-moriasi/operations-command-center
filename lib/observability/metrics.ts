type ActionLabel = "cancel" | "request" | "retry";
type OutcomeLabel = "applied" | "rejected" | "replayed";

const actionCounters = new Map<string, number>();

export function recordExecutionAction(
  action: ActionLabel,
  outcome: OutcomeLabel,
): void {
  const key = `${action}:${outcome}`;
  actionCounters.set(key, (actionCounters.get(key) ?? 0) + 1);
}

export function renderMetrics(): string {
  const lines = [
    "# HELP command_center_up Whether the application process is running.",
    "# TYPE command_center_up gauge",
    "command_center_up 1",
    "# HELP command_center_process_uptime_seconds Process uptime in seconds.",
    "# TYPE command_center_process_uptime_seconds gauge",
    `command_center_process_uptime_seconds ${process.uptime().toFixed(3)}`,
    "# HELP command_center_execution_actions_total Workflow action requests.",
    "# TYPE command_center_execution_actions_total counter",
  ];

  for (const [key, value] of [...actionCounters.entries()].sort()) {
    const [action, outcome] = key.split(":");
    lines.push(
      `command_center_execution_actions_total{action="${action}",outcome="${outcome}"} ${value}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function resetMetrics(): void {
  actionCounters.clear();
}
