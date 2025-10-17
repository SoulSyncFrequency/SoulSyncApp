# FINAL CHECKLIST (pre keys & release)

## Config
- [ ] `ops/.env.backend` filled (API keys, DB, SENTRY_DSN, ENV, RELEASE)
- [ ] `ops/.env.frontend` filled (VITE_SENTRY_*)

## Build & Run
- [ ] `docker compose up -d --build`
- [ ] `GET /api/healthz` == `{ ok: true }`
- [ ] `GET /api/metrics` includes `http_requests_total`
- [ ] `GET /api/version` shows correct version/git
- [ ] `GET /api/docs` renders Swagger UI

## Observability
- [ ] Grafana dashboards visible
- [ ] Alerts sane (no noise)

## Sentry (after real DSN)
- [ ] Trigger test error on FE and BE, verify in Sentry (staging)
- [ ] Promote `SENTRY_ENVIRONMENT=production` when ready

## Snapshot
- [ ] `./ops/config-snapshot.sh` executed (store archive safely)
