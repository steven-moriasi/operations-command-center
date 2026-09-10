# Contributing

## Development checks

Use Node.js 22.22.x:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm audit --audit-level=moderate
docker compose config --quiet
docker build .
```

Changes to authentication, authorization, tenant filtering, idempotency, concurrency, or audit
behavior require negative-path tests and an architecture, threat-model, runbook, or ADR update.

Do not commit real tokens, cookies, personal data, production database records, provider exports, or
secrets. Local fixture subjects, tenants, and credentials must remain synthetic and clearly labeled.

## Review checklist

- authorization still requires tenant, scope, and role together;
- dashboard, execution, and audit queries remain tenant scoped;
- workflow actions preserve idempotency and expected-version checks;
- metrics use bounded labels and logs exclude tokens, cookies, and request bodies;
- browser interactions remain keyboard accessible and status changes are announced;
- database and identity failure behavior remains fail closed.
