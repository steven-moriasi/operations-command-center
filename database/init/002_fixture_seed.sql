INSERT INTO workflows (id, tenant_id, name, owner, schedule)
VALUES
    (
        'workflow-finance-reconciliation',
        'astra-demo',
        'Finance reconciliation',
        'Finance operations',
        '0 */4 * * *'
    ),
    (
        'workflow-customer-onboarding',
        'astra-demo',
        'Customer onboarding',
        'Customer operations',
        NULL
    ),
    (
        'workflow-supplier-intake',
        'astra-demo',
        'Supplier document intake',
        'Procurement operations',
        '*/15 * * * *'
    ),
    (
        'workflow-access-review',
        'astra-demo',
        'Access review export',
        'Identity operations',
        '0 6 * * 1'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO executions (
    id,
    workflow_id,
    tenant_id,
    status,
    started_at,
    finished_at,
    version
)
VALUES
    (
        'run-01J7YQ',
        'workflow-finance-reconciliation',
        'astra-demo',
        'succeeded',
        '2026-09-09T11:56:00.000Z',
        '2026-09-09T11:58:20.000Z',
        2
    ),
    (
        'run-01J7YP',
        'workflow-customer-onboarding',
        'astra-demo',
        'running',
        '2026-09-09T11:54:00.000Z',
        NULL,
        1
    ),
    (
        'run-01J7YN',
        'workflow-supplier-intake',
        'astra-demo',
        'failed',
        '2026-09-09T11:49:00.000Z',
        '2026-09-09T11:51:18.000Z',
        3
    ),
    (
        'run-01J7YM',
        'workflow-access-review',
        'astra-demo',
        'succeeded',
        '2026-09-09T11:42:00.000Z',
        '2026-09-09T11:43:41.000Z',
        2
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO operational_signals (id, tenant_id, level, title, detail)
VALUES
    (
        'signal-supplier-retry',
        'astra-demo',
        'attention',
        'Supplier intake retrying',
        'The local upstream fixture returned 429. Retry is scheduled.'
    ),
    (
        'signal-worker-capacity',
        'astra-demo',
        'healthy',
        'Worker capacity healthy',
        '1 of 40 fixture execution slots is currently in use.'
    ),
    (
        'signal-audit-delivery',
        'astra-demo',
        'healthy',
        'Audit delivery current',
        'No fixture audit records are outside the delivery objective.'
    )
ON CONFLICT (id) DO NOTHING;
