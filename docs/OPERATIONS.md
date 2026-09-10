# Operations Guide

## Service objectives

This lab does not claim measured production objectives. A deployment should define:

- dashboard availability and freshness;
- workflow-action acceptance latency and error budget;
- identity-provider and database dependency budgets;
- audit record durability and retention;
- recovery point and recovery time objectives.

## Health and telemetry

- `GET /api/health`: process liveness;
- `GET /api/ready`: repository connectivity;
- `GET /api/metrics`: Prometheus text for process uptime and bounded action outcomes;
- JSON application logs: timestamp, level, service, operation, correlation ID, tenant, execution,
  action, outcome, and sanitized error type.

Restrict metrics at the network boundary. Do not add subject, tenant, execution ID, correlation ID,
or idempotency key as metric labels.

Initial alert candidates, to calibrate under measured load:

- readiness failures;
- sustained rejected workflow actions;
- database connection saturation;
- increasing failed-execution count or falling success rate;
- action request latency above the interaction budget;
- audit inserts or idempotency writes failing.

## Triage: operator cannot sign in

1. Confirm the configured issuer discovery and JWKS endpoints are reachable from the server.
2. Compare base URL and registered callback URL exactly.
3. Verify issuer, audience, client ID, state, nonce, and server clock.
4. Check whether secure cookies are being sent over the configured scheme.
5. Use sanitized token metadata only; never copy raw tokens or cookies into logs or tickets.

Do not disable issuer, audience, nonce, state, signature, or authorized-party checks as a workaround.

## Triage: dashboard unavailable

1. Check `/api/health` and `/api/ready` separately.
2. Inspect database health, connection count, and application error type.
3. Confirm migrations exist in the expected order.
4. Verify the principal has `resources:read` and an accepted role.
5. Check tenant configuration and tenant-bound rows.

Do not fall back to fixture data in a deployed environment; surface unavailability.

## Triage: action returns conflict

1. Use the response correlation ID to locate the structured log.
2. Refresh the execution and compare its current version with `expectedVersion`.
3. Determine whether the state transition is valid.
4. Confirm the idempotency key was not reused for another action, version, execution, tenant, or
   actor.
5. Retry an uncertain transport result with the same key and identical request.

Generate a new idempotency key only for a genuinely new operator intent.

## Database recovery

The Compose volume is disposable local data. For a real deployment:

1. use managed backups and point-in-time recovery;
2. test restore into an isolated environment;
3. verify schema, row counts, tenant boundaries, action records, and audit records;
4. reconcile automation-engine state before reopening writes;
5. preserve audit retention and legal-hold requirements.

Initialization SQL is a reproducible lab bootstrap, not a production migration rollback system.

## Deployment checklist

- replace the fixture session secret and database password with managed secrets;
- require TLS for browser, identity-provider, and database connections;
- register exact OIDC redirect and logout URLs;
- disable fixture authentication and data modes;
- apply migrations through a reviewed deployment step;
- restrict metrics and administration paths;
- configure connection limits, statement timeouts, request limits, and edge rate limits;
- define audit retention, privacy, backup, restore, and incident access;
- verify login, tenant denial, stale-version conflict, idempotent replay, audit persistence, and
  readiness failure;
- test rollback against identity and schema compatibility.

## Rollback

Application rollback must preserve session-token shape, action state-machine behavior, idempotency
fingerprints, and the current schema. A revision that cannot read stored responses or new execution
states must not be deployed. Prefer forward-compatible schema changes and a controlled roll-forward
when an action migration has already accepted writes.
