CREATE TABLE IF NOT EXISTS workflows (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    name text NOT NULL,
    owner text NOT NULL,
    schedule text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflows_tenant_active_idx
    ON workflows (tenant_id, active);

CREATE TABLE IF NOT EXISTS executions (
    id text PRIMARY KEY,
    workflow_id text NOT NULL REFERENCES workflows (id),
    tenant_id text NOT NULL,
    status text NOT NULL CHECK (
        status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')
    ),
    started_at timestamptz NOT NULL,
    finished_at timestamptz,
    failure_reason text,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS executions_tenant_started_idx
    ON executions (tenant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS executions_workflow_status_idx
    ON executions (workflow_id, status);

CREATE TABLE IF NOT EXISTS operational_signals (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    level text NOT NULL CHECK (level IN ('attention', 'healthy')),
    title text NOT NULL,
    detail text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_signals_tenant_active_idx
    ON operational_signals (tenant_id, active, created_at DESC);
