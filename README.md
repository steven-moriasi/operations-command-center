# Operations Command Center

A portfolio reference implementation of an authenticated operations console for monitoring and
controlling automation workflows. The project uses a Next.js frontend and Node.js backend-for-
frontend with typed APIs, PostgreSQL persistence, OIDC, audit records, and operational health
signals.

The repository is under active construction. Each capability is added and verified through a
separate commit so the architecture and trade-offs remain reviewable.

## Development

Copy `.env.example` to `.env`, then run:

```bash
docker compose up --build
```

Open `http://localhost:3000`.
