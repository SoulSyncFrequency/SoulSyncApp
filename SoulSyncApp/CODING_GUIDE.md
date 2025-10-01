# SoulSync – Coding Guide (Backend + App)

## Principles
- **Safety first**: input validation (Zod), least-privilege, rate-limit, CSRF for state-changing ops.
- **Observability**: logs (structured), metrics (Prometheus), traces (traceId), health/readiness.
- **Testability**: unit (Vitest), e2e (Playwright), smoke (scripts/smoke.sh).
- **Automation**: CI (lint/type/test/build), CD (Docker + Helm), security scans (Semgrep, Trivy).

## Style
- TypeScript strict mode; no `any` (unless justified).
- Small modules; pure functions for business logic; adapters for IO (HTTP/Redis/DB).
- Errors: never throw strings; use Error subtypes; return JSON `{ error, details }` from controllers.

## HTTP API
- Use Zod for request/response schemas; OpenAPI generator must reflect reality.
- Version endpoints behind `/api/v1/*` when you introduce breaking changes.
- Error codes: 400 (validation), 401/403 (auth/perm), 404, 409, 422, 429, 5xx.

## Security
- Helmet + HSTS + CSP (nonce) + CORP/COOP/COEP.
- CSRF on admin POST; token-guard for `/metrics` (optional).
- Non-root containers; read-only root FS; secrets via K8s Secrets.
- Audit logs for sensitive actions (purge, log downloads).

## Performance
- Compression enabled; JSON body limits; avoid large sync loops; paginate.
- Use Redis efficiently; set TTLs for ephemeral data.
- Tune HTTP timeouts (keepAliveTimeout/headersTimeout).

## Testing
- **Unit**: business logic + schema validation.
- **e2e**: critical flows (health, admin UI, purge+CSRF, logs export, metrics).
- **Smoke**: curl `/healthz` `/readyz` `/metrics` → non-zero exit on failure.

## Git & Releases
- Conventional commits recommended.
- Release via tags `vX.Y.Z` → GHCR publish + Release notes (Release Drafter).

## Mobile App Considerations (if/when relevant)
- Keep API stable; document changes in OpenAPI + CHANGELOG.
- Minimize payloads; prefer paging/streaming for long lists.
- Respect platform privacy rules; don’t log PII.
