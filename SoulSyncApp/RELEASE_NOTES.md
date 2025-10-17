# Release Notes (proposed) – v1.0.0

## Highlights
- Admin DLQ UI: JSON/CSV/XLSX export, Summary+DLQ in XLSX, Purge with days + CSRF, Filter, Rate-limit, Audit logs
- Observability: Prometheus metrics (queues, DLQ purge, primary molecule, process), Grafana dashboards + provisioning
- Security: Helmet hardening, HSTS, Permissions-Policy, COOP/COEP/CORP, token+BasicAuth guards
- Logging: Pino JSONL + rotation; admin logs download/export
- Health: /healthz, /livez (eventLoopDelayMs), /readyz (Redis + optional Postgres)
- OpenAPI: generator (Zod→OpenAPI), Swagger UI
- CI/CD: Lint, Format, Type-check, Unit tests (Vitest), e2e (Playwright), Docker build, npm audit, Codecov
- Docker: multi-stage, docker-compose (Redis+Postgres), Render template; QA override adds Prometheus+Grafana

## Breaking/Config
- ENV: `ADMIN_TOKEN` or `ADMIN_TOKENS` (name:token pairs), `ADMIN_PURGE_ENABLED`, `LOG_TTL_DAYS`, `POSTGRES_URL`, `REDIS_URL`

## Upgrade Guide
1. Set ENV (see `.env.example`).
2. `npm ci` (backend), then `docker compose up`.
3. For QA stack: `docker compose -f docker-compose.yml -f docker-compose.override.yml up`.
4. Generate OpenAPI: `npm run openapi:gen`; visit `/api/docs`.
