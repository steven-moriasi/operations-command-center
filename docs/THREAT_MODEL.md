# Threat Model

## Assets

- operator sessions and upstream OIDC tokens;
- role, scope, subject, client, and tenant claims;
- workflow definitions, execution state, and failure details;
- idempotency records and audit events;
- database and identity-provider credentials;
- operational logs and metrics.

## Adversaries

- an unauthenticated network client;
- a valid operator attempting privilege or cross-tenant escalation;
- a malicious site attempting login or action request abuse;
- a caller replaying or racing workflow actions;
- a compromised browser, application process, database, or identity provider;
- an operator making an unsafe configuration or deployment change.

## Trust boundaries

1. Browser to the Next.js application.
2. Application to the Enterprise Identity Gateway authorization, token, and JWKS endpoints.
3. Application to PostgreSQL.
4. Deployment system to session, database, and provider configuration.
5. Command center to any future automation-engine integration.

## Controls present

| Threat | Control |
|---|---|
| Unauthenticated access | signed local session required by protected routes |
| Login response substitution | state, nonce, PKCE verifier, issuer, audience, client, and subject checks |
| Forged token | ID and access-token signatures verified through trusted remote JWKS |
| Wrong token purpose | access-token `typ=Bearer` and authorized-party validation |
| Cross-tenant read/write | tenant derived from verified principal and applied to repository queries |
| Privilege escalation | endpoint-specific role and scope checks |
| Duplicate action after timeout | durable idempotency key and replayed authoritative response |
| Key reuse for another request | SHA-256 fingerprint includes actor and material action fields |
| Lost concurrent update | expected-version comparison while row is locked |
| Concurrent duplicate requests | transaction-scoped PostgreSQL advisory lock |
| Invalid workflow transition | explicit retry/cancel state machine |
| Unattributed write | actor, resource, action, correlation ID, details, and time in audit row |
| Secret disclosure | no raw tokens or cookies in API output, logs, fixtures, or metrics |
| Metric cardinality abuse | fixed action and outcome labels |
| Database outage hidden by fixture | fail-closed repository selection and readiness failure |

## Open risks before production

### Browser request forgery

Same-site cookies and same-origin APIs reduce cross-site action risk, but the lab does not implement a
dedicated CSRF token. Add origin checks and synchronizer or double-submit protection before a
cross-site deployment model is accepted.

### Session lifecycle

The signed session lasts eight hours and has no distributed revocation registry or refresh
rotation. Add server-side session control, logout propagation, key rotation, short lifetimes, and
step-up authentication for sensitive actions.

### Identity-provider availability

New login depends on discovery, token, and JWKS access. Define cache, timeout, rotation, and provider
outage behavior under load. Restrict provider URLs as privileged deployment configuration.

### Authorization freshness

Session roles, scopes, and tenant are a snapshot. Entitlement changes do not affect an issued
session until it expires or is revoked. High-risk operations may need current-state checks.

### Upstream action delivery

The lab updates command-center execution state directly. A real automation engine needs an
authenticated command protocol, outbox or equivalent delivery guarantee, command acknowledgement,
and reconciliation so the console does not claim an action that the engine never accepted.

### Multi-region consistency

PostgreSQL locks coordinate one primary database. They do not solve multi-primary conflicts,
partition behavior, regional failover, clock uncertainty, or global audit ordering.

### Availability and abuse

The application has no built-in edge rate limiter, bot control, per-tenant quota, workload test, or
capacity isolation. Apply controls at the edge and measure action, database, and provider limits.

### Privacy and audit governance

Audit events contain operator subjects and tenant identifiers. Define purpose, retention, access,
export, deletion, legal hold, and incident procedures before using real identities.

## Security non-claims

This document is design analysis, not a penetration test, formal verification, compliance
certification, or assurance that every OAuth, browser, database, and workflow threat is covered.
