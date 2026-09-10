# Principal Engineer Review

## Verdict

The repository is credible as a focused full-stack operations-console lab. Its strongest evidence is
the end-to-end consistency contract around verified identity, tenant authorization, operator intent,
idempotency, optimistic concurrency, audit persistence, and accessible feedback. It should not be
presented as production-ready.

## Review rubric

| Area | Assessment | Evidence |
|---|---|---|
| Problem framing | Strong | clear command-center ownership and explicit non-goals |
| Frontend engineering | Strong for a lab | typed state, semantic UI, async/error/auth states, controlled actions |
| API design | Strong for a lab | typed routes, status mapping, idempotency key, expected version, correlation ID |
| Authentication | Moderate | sound OIDC/PKCE and signed-session implementation; no live gateway test here |
| Authorization | Strong | tenant, scope, and role enforced together |
| Data consistency | Strong for one primary | transaction, row lock, advisory lock, replayable response |
| Audit | Moderate | durable action audit and tenant API; no retention/export governance |
| Observability | Moderate | health/readiness, structured logs, bounded metrics; no traces or SLOs |
| Accessibility | Moderate | semantic/component evidence; no browser matrix or external audit |
| Testing | Strong | unit, API, repository, component, build, container, and Compose smoke layers |
| Operability | Moderate | runbook and deterministic bootstrap; no migration rollback or restore drill |
| Documentation | Strong | architecture, threats, accessibility, ADRs, evidence limits, roadmap |

## Material strengths

1. Operator authorization is not reduced to a role check; scope and tenant remain explicit.
2. A retried transport request returns the stored authoritative result rather than applying the
   action twice.
3. Idempotency keys are bound to actor and request semantics, while correlation IDs remain
   independently traceable.
4. The expected version is checked while the execution row is locked.
5. State change, audit event, and replay record share one database transaction.
6. Storage failure does not silently replace operational data with a fixture.
7. The interface exposes failure and authentication states and uses native controls instead of
   clickable containers.

## Production blockers

### P1: integrate with the automation command boundary

Direct database state mutation demonstrates coordination but is not a production control plane.
Use an authenticated command API or durable outbox, define acknowledgement and timeout semantics,
and reconcile command-center state with engine truth.

### P1: harden browser and session security

Add CSRF protection, origin checks, managed signing-key rotation, server-side revocation, short
session policy, CSP, secure deployment headers, and step-up authentication for sensitive actions.

### P1: establish database lifecycle and recovery

Replace bootstrap SQL with reviewed migrations, prove forward/backward compatibility, use managed
backups, exercise restore, define failover, and validate idempotency through recovery.

### P1: test the complete identity integration

Run the console against the Identity Gateway, exercise interactive login/logout, key rotation,
provider outage, entitlement change, and tenant denial, and define redirect compatibility during
deployments.

### P2: add abuse and capacity controls

Measure request and action latency, add rate limits and per-tenant quotas, define connection and
statement budgets, and exercise duplicate, concurrent, and hot-key load.

### P2: complete assurance

Add browser axe and screen-reader evidence, traces, audit export/retention governance, privacy review,
dependency provenance, and independent security/accessibility review.

## Recommendation

Use the repository as portfolio evidence for TypeScript full-stack design, operations UX, OIDC,
authorization, concurrency, idempotency, auditability, accessibility-aware implementation, and
production-minded documentation. Resolve every P1 boundary before production use.
