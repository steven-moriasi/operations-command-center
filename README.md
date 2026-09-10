# Operations Command Center

A portfolio reference implementation of an authenticated console for monitoring and controlling
automation workflows. It combines a Next.js interface and backend-for-frontend, typed TypeScript
APIs, PostgreSQL persistence, OIDC Authorization Code with PKCE, role/scope/tenant authorization,
idempotent workflow actions, audit records, and operational telemetry.

This is an inspectable engineering lab, not evidence of a hosted production service.

## Capabilities

- dashboard metrics, execution state, operational signals, and tenant audit history;
- retry and cancellation forms with optimistic concurrency and idempotency keys;
- fixture authentication for isolated review and signed OIDC sessions for gateway integration;
- strict access-token verification through remote JWKS before a local session is issued;
- PostgreSQL transactions, row locks, and advisory locks for durable workflow actions;
- structured logs, correlation IDs, health, readiness, and Prometheus metrics;
- responsive semantic UI with keyboard focus, live status announcements, and automated component
  tests;
- multi-stage non-root container and a reproducible PostgreSQL Compose environment.

## Architecture

```text
browser
  │ secure session cookie
  ▼
Next.js backend-for-frontend
  ├── OIDC/PKCE ───────────────▶ Enterprise Identity Gateway
  ├── typed dashboard APIs
  ├── authorization boundary
  ├── workflow action service
  ├── audit and metrics APIs
  └── PostgreSQL repository ───▶ PostgreSQL
```

The fixture mode preserves the same repository and principal interfaces without claiming a live
upstream deployment. See `docs/ARCHITECTURE.md` and `docs/adr/`.

## Quick start

The runtime requires Node.js 22.22.x. The easiest local path uses Docker:

```bash
docker compose up --build --wait
```

Open `http://localhost:3000`. Compose intentionally uses synthetic local credentials and fixture
authentication. Stop and delete local data with:

```bash
docker compose down --volumes
```

For application-only development:

```bash
npm ci
npm run dev
```

`COMMAND_CENTER_DATA_MODE=fixture` avoids a database dependency. Copy `.env.example` to `.env.local`
and replace the session secret before enabling OIDC mode.

## Identity Gateway integration

Set `COMMAND_CENTER_AUTH_MODE=oidc` and configure the issuer, client ID, audience, base URL, and a
random session secret. The matching `command-center` public client is defined by the
Enterprise Identity Gateway repository. The callback validates state, nonce, issuer, audience,
authorized party, subject consistency, access-token type, and both token signatures before issuing
an HTTP-only local session.

## APIs

| Endpoint | Purpose | Required permission |
|---|---|---|
| `GET /api/health` | process liveness | public |
| `GET /api/ready` | repository readiness | public |
| `GET /api/metrics` | bounded process/action metrics | deployment boundary |
| `GET /api/me` | current principal | authenticated |
| `GET /api/dashboard` | tenant operations snapshot | `resources:read` |
| `GET /api/audit?limit=20` | tenant audit records | `audit:read` |
| `POST /api/executions/:id/actions` | retry or cancel an execution | `operations:write` |

Action requests require an `Idempotency-Key` and an `expectedVersion`. Responses include
`x-correlation-id`; stale versions, key reuse with another request, and invalid transitions return
`409`.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm audit --audit-level=moderate
docker compose config --quiet
docker build .
```

The Compose smoke test in CI additionally verifies database-backed dashboard, workflow action,
idempotent replay, audit persistence, and metrics behavior.

## Engineering notes

- `docs/ARCHITECTURE.md` — boundaries, data model, and request flows
- `docs/OPERATIONS.md` — runbook, alerts, recovery, deployment, and rollback
- `docs/THREAT_MODEL.md` — assets, adversaries, controls, and open risks
- `docs/ACCESSIBILITY.md` — interface contract and verification evidence
- `docs/PORTFOLIO_EVIDENCE.md` — claims mapped to implementation
- `docs/PRINCIPAL_ENGINEER_REVIEW.md` — candid technical assessment
- `docs/ROADMAP.md` — work required beyond this lab

## Limitations

The reference environment has one application replica, local fixture identity, local HTTP, public
development database credentials, no CSRF token beyond same-site cookie behavior, no distributed
tracing, no rate limiter, and no backup/restore drill. Production use requires the controls listed in
the threat model and operations guide.
