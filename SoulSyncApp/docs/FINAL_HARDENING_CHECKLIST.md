# Final Hardening Checklist
- CSP enforce: set `CSP_REPORT_ONLY=false` and confirm `report-uri /csp-report` works clean.
- Outbound calls: ensure all external HTTP uses `requestWithCB` (timeouts + retries + circuit breaker).
- Contract tests: success + error schemas (429/503 + common 4xx) covered for key routes.
- SLOs/alerts: burn-rate and p95/p99 active; alert routing verified.
- Secrets scanning: CodeQL + Gitleaks passing; ENV validation passing in production.
