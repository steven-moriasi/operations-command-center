# Roadmap

The roadmap describes engineering work, not delivery commitments.

## Stage 1: real automation-engine command delivery

- replace direct execution mutation with authenticated command submission;
- use an outbox or equivalent durable publication boundary;
- model acknowledgement, rejection, timeout, and reconciliation;
- expose execution event history and command provenance;
- exercise duplicate delivery and unavailable-upstream behavior.

## Stage 2: browser and identity hardening

- add CSRF tokens and strict origin validation;
- deploy a restrictive content security policy and security headers;
- implement server-side session revocation and signing-key rotation;
- test full login, logout, provider outage, and key rotation against the Identity Gateway;
- add step-up authentication for high-risk operations.

## Stage 3: database lifecycle and resilience

- adopt a reviewed production migration tool;
- test expand/contract schema changes and application rollback;
- configure managed backups and point-in-time restore;
- exercise failover and recovery with idempotency records in flight;
- define audit partitioning, retention, export, and legal hold.

## Stage 4: operations scale

- add traces and latency/error saturation dashboards;
- define service objectives and alert thresholds from measured behavior;
- add edge limits, per-tenant quotas, and capacity isolation;
- load test concurrent actions, hot keys, dashboard reads, and audit queries;
- test multi-replica and regional failure semantics.

## Stage 5: product and assurance

- add workflow search, filters, pagination, detail history, and approvals;
- validate responsive and assistive-technology behavior in real browsers;
- complete threat modeling with automation-engine and infrastructure owners;
- commission independent security and accessibility reviews;
- publish measured limits without extrapolating production claims.
