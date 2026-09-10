# Portfolio Evidence Map

This document maps engineering claims to inspectable implementation and verification. It does not
turn a reference repository into evidence of production operation or business outcomes.

| Claim | Implementation evidence | Verification evidence |
|---|---|---|
| React and Next.js console | App Router page, client dashboard, route handlers | component test and production build |
| Type-safe full stack | shared domain/principal interfaces and strict TypeScript | `tsc --noEmit` |
| Dashboard and workflow forms | metrics, executions, signals, audit, retry/cancel UI | role-based component interactions |
| OIDC Authorization Code with PKCE | login/callback routes, verifier/challenge, state, nonce | cryptographic and failure-path tests |
| Signed local sessions | HS256 HTTP-only session cookie | issue, verify, expiry, and tamper tests |
| Tenant authorization | conjunctive tenant, scope, and role policy | authorization and route tests |
| Durable persistence | PostgreSQL repository and ordered schema/seed SQL | Compose database-backed dashboard |
| Optimistic concurrency | expected version and row lock | stale-version unit and integration behavior |
| Idempotent workflow actions | request fingerprint, advisory lock, replay response | duplicate and conflicting-key tests |
| Auditability | transactionally inserted action event and tenant API | fixture test and Compose audit query |
| Observability | correlation-aware JSON logs, health, readiness, Prometheus metrics | route tests and Compose smoke checks |
| Accessibility | semantic elements, accessible names, focus styles, live regions | Testing Library role/name interactions |
| Runtime packaging | pinned Node/PostgreSQL images and non-root standalone app | Docker build and Compose startup |
| Delivery controls | lint/types/coverage/build/audit, pinned CI actions, Dependabot | `.github/` configuration |

## Verified locally

- ESLint and strict TypeScript;
- deterministic unit, API, repository, and component tests with an 80% coverage gate;
- optimized Next.js production build;
- Docker image build and Compose configuration;
- fresh PostgreSQL initialization and database-backed dashboard;
- workflow retry, idempotent replay, stale-version conflict, and audit persistence;
- process health, repository readiness, principal, audit, and metrics APIs.

These checks describe the local revision when the review was written. Provider CI status is a
separate signal after publication.

## Not proved by this repository

- production availability, latency, scale, accessibility conformance, recovery objectives, or
  security;
- live integration with a deployed automation engine or identity environment;
- multi-region or multi-primary consistency;
- production secret, certificate, migration, backup, or audit-retention lifecycle;
- penetration testing, external accessibility audit, compliance certification, or formal assurance;
- historical production deployment, customer adoption, realized savings, or business outcomes.
