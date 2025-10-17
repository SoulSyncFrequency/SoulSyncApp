# SoulSync – Coding Standards (Backend + Frontend)

## Languages & Tooling
- TypeScript everywhere (backend + frontend). Target Node 18+ on server.
- Linting: ESLint; Formatting: Prettier. Enforce pre-commit via Husky (optional).
- Tests: Vitest/Jest (unit), Playwright (e2e) – optional but recommended.

## Backend
- Framework: Express. Observability: Sentry + prom-client.
- Endpoints: `/healthz`, `/readyz`, `/livez`, `/metrics`, `/admin/*`, `/api/*`.
- Validation: Zod for all inputs/outputs.
- Queues: BullMQ + ioredis; DLQ `<queue>:dlq`; idempotent job IDs; metrics & dashboards.
- Security: Helmet (CSP in prod), COOP/COEP, Referrer-Policy, Permissions-Policy. CSRF for state-changing browser routes.
- Config: All secrets via ENV. No secrets in repo.

## Frontend
- React + Vite/Capacitor. Type-safe APIs; schemas shared when moguće.
- i18n HR/EN. Error boundaries + Sentry for FE (optional).

## CI/CD
- Lint + type-check + test on PR. Coverage → Codecov. Build artifacts for FE/BE.
- Security scans (npm audit) + basic secret scanning. Required checks to merge.

## Branching
- `main` = stable; `develop` = integration; feature branches `feat/…`, fix `fix/…`.
- PR template: scope, tests, screenshots, risk & rollback, ENV changes.

## Commit Style
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`.

## Logging
- Structured JSON logs; include `requestId`. No sensitive data. Log levels via ENV.

## Performance
- HTTP caching (conditional/ETag), rate limiting, concurrency caps, backpressure.
- Queue backoffs, DLQ alerts, idempotency.

## App Store readiness (Capacitor)
- Privacy policy, data safety forms, offline handling, graceful error states, splash & icons.

