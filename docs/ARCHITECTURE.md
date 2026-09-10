# Architecture

## Scope

This repository demonstrates a browser operations console and backend-for-frontend for tenant-bound
automation monitoring and control. It does not execute workflows itself. The command center owns
operator sessions, presentation APIs, authorization, action coordination, audit visibility, and
database persistence.

## Components

```text
┌──────────────┐   authorization code + PKCE   ┌──────────────────┐
│ browser      │ ─────────────────────────────▶ │ Identity Gateway │
└──────┬───────┘                                └────────┬─────────┘
       │ HTTP-only signed session                        │ JWKS
       ▼                                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ Next.js backend-for-frontend                                     │
│ principal → role/scope/tenant policy → repository → API response │
└───────────────┬───────────────────────┬──────────────────────────┘
                │                       │
                ▼                       ▼
      ┌──────────────────┐    ┌─────────────────────┐
      │ PostgreSQL       │    │ structured logs and │
      │ state + audit    │    │ Prometheus metrics  │
      └──────────────────┘    └─────────────────────┘
```

### Browser interface

The client renders dashboard, execution, signal, and audit data from same-origin APIs. Retry and
cancel forms send the version that the operator observed and a new idempotency key. The interface
updates from the authoritative action response and announces status through an ARIA live region.

### Authentication

Fixture mode returns one synthetic principal for isolated review. OIDC mode starts Authorization
Code with PKCE, stores state, nonce, and verifier in secure HTTP-only cookies, exchanges the code,
verifies ID and access tokens against remote JWKS, and issues an eight-hour signed local session.

The session contains a typed principal rather than upstream tokens. Raw tokens are not persisted in
browser storage or exposed through application APIs.

### Authorization

Every protected route resolves the principal and requires:

1. the principal tenant to match the repository tenant;
2. the endpoint's scope;
3. at least one accepted role.

Dashboard requires `resources:read`; audit requires `audit:read`; execution changes require
`operations:write`. Authentication failure returns `401` and policy failure returns `403`.

### Repository boundary

`OperationsRepository` has fixture and PostgreSQL implementations. Both expose dashboard reads,
execution reads, workflow actions, audit listing, and readiness. This keeps route logic independent
from storage mode and allows deterministic tests without pretending the fixture is an external
system.

## Workflow action transaction

```text
operator        action API        PostgreSQL
   │ POST + key/version │              │
   ├───────────────────▶│ BEGIN        │
   │                    ├─────────────▶│ advisory lock(key)
   │                    ├─────────────▶│ existing idempotency record?
   │                    ├─────────────▶│ SELECT execution FOR UPDATE
   │                    ├─────────────▶│ compare expected version
   │                    ├─────────────▶│ update state + version
   │                    ├─────────────▶│ insert audit event
   │                    ├─────────────▶│ store response by key
   │                    ├─────────────▶│ COMMIT
   │ authoritative result              │
   ◀────────────────────┤              │
```

Retry permits failed or cancelled executions and increments the attempt. Cancel permits queued or
running executions. Other transitions, stale versions, and an idempotency key reused for another
actor or request return conflict without changing state.

## Data model

- `workflows`: tenant-owned workflow metadata;
- `executions`: workflow status, version, attempt, timestamps, and failure reason;
- `operational_signals`: tenant health and attention messages;
- `execution_action_requests`: tenant/key fingerprint and replayable response;
- `audit_events`: actor, action, resource, correlation ID, bounded details, and timestamp.

Tenant filters are explicit in every repository query. A foreign key connects executions to
workflows; action writes lock the execution row before changing it.

## Availability semantics

`/api/health` indicates a running process. `/api/ready` verifies the selected repository and returns
failure when PostgreSQL is unavailable. The dashboard does not silently fall back from PostgreSQL to
fixture data, because that could present stale or misleading operational state.

Metrics intentionally use bounded action/outcome labels. Structured logs contain operation,
correlation, execution, tenant, and outcome metadata but omit tokens, cookies, and request bodies.

## Deployment shape

The Docker image builds Next.js standalone output and runs as a non-root user. Compose starts
PostgreSQL first, applies ordered initialization SQL to a new volume, waits for database health, and
then starts the application.

The current design supports one application deployment with durable database coordination. A
multi-region or multi-database deployment needs explicit consistency, routing, failover, and audit
ordering design.
