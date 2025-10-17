# SoulSync — Release Runbook

## 1) Preflight
- Ensure `main` is green (CI: lint, build, tests, coverage, security scans)
- Optional: run `Predeploy Check` workflow with `CHECK_BASE_URL` pointing to staging

## 2) Prepare environment
```bash
cp ops/.env.backend.example ops/.env.backend
# Fill real secrets/keys
```

## 3) Bring up stack
```bash
cd ops
docker compose up -d --build
```

## 4) Smoke checks
- `GET /api/healthz` → `{ ok: true }`
- `GET /api/readiness` → `{ ready: true }`
- `GET /api/metrics` contains `http_requests_total`, `errors_total`
- `GET /api/version` shows build version

## 5) Observability
- Grafana dashboards load
- Alerts wiring correct (noisy checks disabled)

## 6) If all good — tag release
- Create a Git tag (semver) and publish release notes (CHANGELOG)
- (Optional) Enable branch protection on `main` to require status checks

## 7) Rollback (if needed)
```bash
./ops/config-restore.sh ops/backups/config-<TS>.tar.gz
docker compose -f ops/docker-compose.yml restart backend frontend
```
