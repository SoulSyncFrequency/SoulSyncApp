# Go-Live Checklist (CSP Enforce + Contracts 100%)
- CSP: `CSP_REPORT_ONLY=false` (default in production) and `CSP_REPORT_URI=/csp-report` configured. Analyzer clean ≥7d.
- OpenAPI: routes declare 400/401/403/404/429/503; contract tests pass (offline validators).
- Outbound: requestWithCB everywhere (timeouts + retries + circuit breaker).
- Readiness: DB + Redis + (optional) SMTP/S3 checks green; /self-test ok.
- Observability: Sentry DSN + tuned sampling; Prometheus scraping /metrics; burn-rate alerts armed.
- Security: HSTS on prod; CORP/Permissions-Policy/Referrer-Policy; Gitleaks/CodeQL green; logs rotation.
