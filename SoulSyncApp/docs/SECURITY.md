# Security Posture (Summary)

## Headers & Policies
- CSP (Report-Only → Enforce via `CSP_ENFORCE`), COOP/COEP/CORP, HSTS (opt-in `ENABLE_HSTS`, `HSTS_PRELOAD`), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Robots-Tag (toggle via `ROBOTS_INDEX`).
- CORS: allowlist via `CORS_ORIGIN` (supports `*` and `*.domain.com`), methods/headers tunable.

## Endpoints
- Health: `/api/healthz`, `/api/readiness`, `/api/status`
- Observability: `/api/metrics`, `Server-Timing`, `X-Request-Id`
- Security Reporting: `/api/csp-report` (rate-limited)
- Docs: `/api/docs`, `/api/openapi.yaml` (toggle via `ENABLE_API_DOCS`)

## Limits & Guards
- Rate limits on API, CSP-report, test-error; body size limits; maintenance mode; host allowlist; HTTPS redirect toggle.

## Incident Testing
- `/api/_test-error` behind `ENABLE_TEST_ENDPOINTS=true` to verify Sentry path.
