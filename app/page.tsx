import { getFixtureDashboard } from "../lib/services/dashboard";

const statusLabels = {
  cancelled: "Cancelled",
  failed: "Failed",
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
};

const metricDefinitions = [
  {
    format: (value: number) => `${value}%`,
    key: "successRate",
    label: "Success rate",
    trend: "Completed fixture runs",
  },
  {
    format: (value: number) => value.toString(),
    key: "activeWorkflows",
    label: "Active workflows",
    trend: "Local catalogue",
  },
  {
    format: (value: number) => value.toString(),
    key: "runningExecutions",
    label: "Running now",
    trend: "Fixture capacity",
  },
  {
    format: (value: number) => value.toString(),
    key: "failedExecutions",
    label: "Needs attention",
    trend: "Failed fixture runs",
  },
] as const;

const statusClasses = {
  cancelled: "status-failed",
  failed: "status-failed",
  queued: "status-running",
  running: "status-running",
  succeeded: "status-success",
};

function formatRelativeTime(timestamp: string, generatedAt: string): string {
  const elapsedMinutes = Math.max(
    0,
    Math.round(
      (Date.parse(generatedAt) - Date.parse(timestamp)) / (60 * 1000),
    ),
  );

  return `${elapsedMinutes} min ago`;
}

export default function OverviewPage(): React.JSX.Element {
  const dashboard = getFixtureDashboard();

  return (
    <div className="content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Local fixture data · System operating normally</p>
          <h1>Automation operations, one clear view.</h1>
          <p className="lede">
            Monitor execution health, inspect failures, and take controlled
            workflow actions without crossing service ownership boundaries.
          </p>
        </div>
        <button className="primary-action" type="button">
          View active incidents
        </button>
      </section>

      <section aria-label="Operational metrics" className="metrics">
        {metricDefinitions.map((definition) => (
          <article className="metric" key={definition.key}>
            <span className="metric-label">{definition.label}</span>
            <div className="metric-row">
              <strong className="metric-value">
                {definition.format(dashboard.metrics[definition.key])}
              </strong>
              <span className="metric-trend">{definition.trend}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid">
        <section aria-labelledby="recent-executions" className="panel">
          <header className="panel-header">
            <h2 id="recent-executions">Recent executions</h2>
            <a className="text-action" href="#executions">
              View all
            </a>
          </header>
          <ul className="execution-list">
            {dashboard.executions.map((execution) => (
              <li className="execution" key={execution.id}>
                <div className="execution-name">
                  <strong>{execution.workflowName}</strong>
                  <span>{execution.id}</span>
                </div>
                <span
                  className={`status ${statusClasses[execution.status]}`}
                >
                  {statusLabels[execution.status]}
                </span>
                <span className="execution-time">
                  {formatRelativeTime(execution.startedAt, dashboard.generatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="operational-signals" className="panel">
          <header className="panel-header">
            <h2 id="operational-signals">Operational signals</h2>
            <span className="text-action">Live</span>
          </header>
          <ul className="signal-list">
            {dashboard.signals.map((signal) => (
              <li
                className={`signal ${
                  signal.level === "attention" ? "signal-attention" : ""
                }`}
                key={signal.id}
              >
                <strong>{signal.title}</strong>
                <span>{signal.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
