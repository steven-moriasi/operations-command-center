const metrics = [
  { label: "Success rate", trend: "30 day window", value: "99.4%" },
  { label: "Active workflows", trend: "3 scheduled", value: "24" },
  { label: "Running now", trend: "Within capacity", value: "7" },
  { label: "Needs attention", trend: "2 acknowledged", value: "3" },
];

const executions = [
  {
    id: "run-01J7YQ",
    name: "Finance reconciliation",
    status: "Succeeded",
    statusClass: "status-success",
    time: "2 min ago",
  },
  {
    id: "run-01J7YP",
    name: "Customer onboarding",
    status: "Running",
    statusClass: "status-running",
    time: "4 min ago",
  },
  {
    id: "run-01J7YN",
    name: "Supplier document intake",
    status: "Failed",
    statusClass: "status-failed",
    time: "11 min ago",
  },
  {
    id: "run-01J7YM",
    name: "Access review export",
    status: "Succeeded",
    statusClass: "status-success",
    time: "18 min ago",
  },
];

export default function OverviewPage(): React.JSX.Element {
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
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <div className="metric-row">
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-trend">{metric.trend}</span>
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
            {executions.map((execution) => (
              <li className="execution" key={execution.id}>
                <div className="execution-name">
                  <strong>{execution.name}</strong>
                  <span>{execution.id}</span>
                </div>
                <span className={`status ${execution.statusClass}`}>
                  {execution.status}
                </span>
                <span className="execution-time">{execution.time}</span>
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
            <li className="signal signal-attention">
              <strong>Supplier intake retrying</strong>
              <span>Upstream returned 429. Next attempt in 42 seconds.</span>
            </li>
            <li className="signal">
              <strong>Worker capacity healthy</strong>
              <span>7 of 40 execution slots currently in use.</span>
            </li>
            <li className="signal">
              <strong>Audit delivery current</strong>
              <span>No pending records outside the delivery objective.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
