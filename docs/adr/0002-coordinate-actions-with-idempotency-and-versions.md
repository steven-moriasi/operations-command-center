# ADR 0002: Coordinate actions with idempotency and versions

- Status: accepted
- Date: 2026-09-09

## Context

Operators can double-submit, clients can retry after an uncertain timeout, and multiple operators can
act on the same execution. A last-write-wins update can apply intent twice or overwrite a newer
state.

## Decision

Require a tenant-scoped idempotency key and expected execution version. Serialize equal keys with a
transaction advisory lock, bind each key to a fingerprint containing actor and material request
fields, lock the execution row, validate its version and transition, then store state, audit event,
and replayable response in one transaction.

## Consequences

- identical retries return the original result;
- a reused key with different semantics fails closed;
- stale operator views cannot overwrite newer execution state;
- equal keys serialize through PostgreSQL and hot keys can become a capacity concern;
- retention policy must preserve idempotency records for at least the supported retry window.
