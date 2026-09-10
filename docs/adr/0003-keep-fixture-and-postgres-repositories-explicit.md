# ADR 0003: Keep fixture and PostgreSQL repositories explicit

- Status: accepted
- Date: 2026-09-09

## Context

Portfolio review benefits from a zero-infrastructure mode, while operational behavior requires
durable database evidence. Silent fallback from a failed database to local fixtures would make a
degraded console appear healthy and could mislead operators.

## Decision

Implement fixture and PostgreSQL repositories behind one typed interface, selected explicitly by
configuration. Fixture identity and data remain clearly labeled. PostgreSQL readiness failure is
surfaced and never causes automatic fixture fallback.

## Consequences

- unit and component tests remain deterministic;
- Compose demonstrates durable state with the same route contract;
- fixture behavior must track PostgreSQL semantics through shared tests and review;
- fixture mode is not an availability mechanism and must be disabled in real deployments.
