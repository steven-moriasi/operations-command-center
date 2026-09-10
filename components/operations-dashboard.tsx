"use client";

import { useEffect, useState } from "react";

import type { Principal } from "../lib/auth/types";
import type {
  DashboardSnapshot,
  ExecutionAction,
  ExecutionActionResult,
  ExecutionSummary,
} from "../lib/domain";

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
    trend: "Completed runs",
  },
  {
    format: (value: number) => value.toString(),
    key: "activeWorkflows",
    label: "Active workflows",
    trend: "Tenant catalogue",
  },
  {
    format: (value: number) => value.toString(),
    key: "runningExecutions",
    label: "Running now",
    trend: "Current workload",
  },
  {
    format: (value: number) => value.toString(),
    key: "failedExecutions",
    label: "Needs attention",
    trend: "Failed runs",
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

function executionAction(
  execution: ExecutionSummary,
): ExecutionAction | null {
  if (execution.status === "failed" || execution.status === "cancelled") {
    return "retry";
  }
  if (execution.status === "queued" || execution.status === "running") {
    return "cancel";
  }
  return null;
}

export function OperationsDashboard(): React.JSX.Element {
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [busyExecution, setBusyExecution] = useState<string | null>(null);
  const [message, setMessage] = useState("Loading operations data");

  useEffect(() => {
    async function loadDashboard(): Promise<void> {
      const [dashboardResponse, principalResponse] = await Promise.all([
        fetch("/api/dashboard", { cache: "no-store" }),
        fetch("/api/me", { cache: "no-store" }),
      ]);
      if (dashboardResponse.status === 401 || principalResponse.status === 401) {
        setAuthRequired(true);
        setMessage("Authentication is required");
        return;
      }
      if (!dashboardResponse.ok || !principalResponse.ok) {
        setMessage("Operations data is temporarily unavailable");
        return;
      }

      setDashboard((await dashboardResponse.json()) as DashboardSnapshot);
      setPrincipal((await principalResponse.json()) as Principal);
      setMessage("Operations data loaded");
    }

    void loadDashboard();
  }, []);

  async function submitAction(
    execution: ExecutionSummary,
    action: ExecutionAction,
  ): Promise<void> {
    setBusyExecution(execution.id);
    setMessage(`${action === "retry" ? "Retrying" : "Cancelling"} execution`);
    const response = await fetch(`/api/executions/${execution.id}/actions`, {
      body: JSON.stringify({
        action,
        expectedVersion: execution.version,
      }),
      headers: {
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      method: "POST",
    });
    if (!response.ok) {
      setBusyExecution(null);
      setMessage(
        response.status === 409
          ? "The execution changed; refresh before trying again"
          : "The workflow action could not be applied",
      );
      return;
    }

    const result = (await response.json()) as ExecutionActionResult;
    setDashboard((current) =>
      current === null
        ? current
        : {
            ...current,
            executions: current.executions.map((item) =>
              item.id === result.execution.id ? result.execution : item,
            ),
          },
    );
    setBusyExecution(null);
    setMessage(
      result.replayed
        ? "The prior workflow action result was replayed"
        : `Execution ${action === "retry" ? "queued for retry" : "cancelled"}`,
    );
  }

  if (authRequired) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Protected operations workspace</p>
        <h1>Sign in to continue.</h1>
        <p className="lede">
          Authentication is delegated to the Enterprise Identity Gateway using
          Authorization Code and PKCE.
        </p>
        <a className="primary-action" href="/api/auth/login">
          Sign in with Identity Gateway
        </a>
      </section>
    );
  }

  if (dashboard === null || principal === null) {
    return (
      <section aria-live="polite" className="empty-state">
        <p>{message}</p>
      </section>
    );
  }

  return (
    <div className="content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            {dashboard.source === "database"
              ? "PostgreSQL reference data"
              : "Local fixture data"}{" "}
            · System operating normally
          </p>
          <h1>Automation operations, one clear view.</h1>
          <p className="lede">
            Monitor execution health, inspect failures, and take controlled
            workflow actions without crossing service ownership boundaries.
          </p>
        </div>
        <div className="operator-card">
          <div>
            <strong>{principal.displayName}</strong>
            <span>{principal.tenantId}</span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="secondary-action" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <p aria-live="polite" className="sr-only">
        {message}
      </p>

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
        <section
          aria-labelledby="recent-executions"
          className="panel"
          id="executions"
        >
          <header className="panel-header">
            <h2 id="recent-executions">Recent executions</h2>
            <span className="text-action">Version-controlled actions</span>
          </header>
          <ul className="execution-list">
            {dashboard.executions.map((execution) => {
              const action = executionAction(execution);
              return (
                <li className="execution" key={execution.id}>
                  <div className="execution-name">
                    <strong>{execution.workflowName}</strong>
                    <span>
                      {execution.id} · version {execution.version}
                    </span>
                  </div>
                  <span
                    className={`status ${statusClasses[execution.status]}`}
                  >
                    {statusLabels[execution.status]}
                  </span>
                  <span className="execution-time">
                    {formatRelativeTime(
                      execution.startedAt,
                      dashboard.generatedAt,
                    )}
                  </span>
                  {action === null ? (
                    <span className="action-unavailable">No action</span>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitAction(execution, action);
                      }}
                    >
                      <button
                        aria-label={`${action} ${execution.workflowName}`}
                        className="execution-action"
                        disabled={busyExecution === execution.id}
                        type="submit"
                      >
                        {busyExecution === execution.id
                          ? "Working…"
                          : action === "retry"
                            ? "Retry"
                            : "Cancel"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="operational-signals" className="panel">
          <header className="panel-header">
            <h2 id="operational-signals">Operational signals</h2>
            <span className="text-action">Current</span>
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
