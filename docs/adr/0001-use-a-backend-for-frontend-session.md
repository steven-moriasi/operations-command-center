# ADR 0001: Use a backend-for-frontend session

- Status: accepted
- Date: 2026-09-09

## Context

A browser console can hold OIDC access tokens directly, but persistent browser token storage expands
the impact of script execution and makes same-origin application APIs responsible for bearer-token
handling in client code.

## Decision

The Next.js server performs Authorization Code with PKCE, validates ID and access tokens, converts
claims to a typed principal, and issues a signed HTTP-only local session. The browser calls
same-origin APIs and does not receive or persist upstream tokens.

## Consequences

- browser components do not manage bearer tokens;
- session signing, expiry, revocation, rotation, CSRF, and secure-cookie policy become server
  responsibilities;
- fixture authentication can implement the same principal contract for isolated review;
- production needs managed signing keys and server-side revocation rather than this lab's static
  secret and fixed lifetime.
