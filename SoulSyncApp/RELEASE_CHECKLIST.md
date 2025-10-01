# Release Checklist

- [ ] Update CHANGELOG.md with latest highlights
- [ ] Ensure `.env` values are set in production (ADMIN_TOKEN/ADMIN_TOKENS, REDIS_URL, POSTGRES_URL, LOG_TTL_DAYS, SENTRY_DSN)
- [ ] Run `npm ci` in `backend/` and ensure CI pipeline is green (lint, type-check, tests, e2e)
- [ ] Generate OpenAPI: `npm run openapi:gen` → verify `/api/docs`
- [ ] Build and test Docker image locally: `docker build -t soulsync/backend:local ./backend`
- [ ] Start QA stack: `docker compose -f docker-compose.yml -f docker-compose.override.yml up`
- [ ] Perform TEST_PLAN.md and fill QA_REPORT.md
- [ ] Tag release: `git tag v1.0.0 && git push --tags` (or next semver)
- [ ] Verify GitHub Release auto-generated + artifacts
- [ ] Deploy to Render (set env vars) and re-run smoke tests (/healthz, /readyz, /metrics, admin UI)

