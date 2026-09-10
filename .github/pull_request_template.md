## Summary

<!-- What changed and why? -->

## Operations contract and risk

<!-- Which identity, tenant, workflow state, concurrency, audit, or availability behavior changes? -->

## Verification

- [ ] lint
- [ ] typecheck
- [ ] affected unit and component tests
- [ ] full suite with coverage gate
- [ ] production build
- [ ] dependency audit
- [ ] Docker or Compose checks, if runtime behavior changed

## Security and operations review

- [ ] Tenant, role, and scope checks remain conjunctive
- [ ] Idempotency and expected-version behavior remain fail closed
- [ ] Logs, metrics, errors, tests, and fixtures contain no real secrets or production data
- [ ] UI changes preserve keyboard access, visible focus, labels, and live status
- [ ] Architecture, threat model, runbook, accessibility note, or ADRs were updated where needed
