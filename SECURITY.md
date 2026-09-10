# Security Policy

## Reporting

Do not open a public issue containing tokens, cookies, credentials, personal data, production
records, or exploitation details. Use GitHub private vulnerability reporting when available.

Include the affected revision, impact, minimal reproduction, and sanitized evidence. Remove
authorization headers, cookies, subjects, tenants, correlation IDs, and idempotency keys unless a
specific value is essential to the report.

## Supported versions

This engineering lab supports the latest default-branch revision. It is not a hosted service and
does not publish long-term support releases.

## Deployment warning

Compose uses fixture authentication, local HTTP, a single replica, public local database
credentials, and a development session secret. Production use requires managed secrets, TLS, CSRF
protection, edge rate limits, restricted metrics access, hardened OIDC and database networking,
multi-replica idempotency validation, backup/restore exercises, audit retention controls, and an
independent security review.
