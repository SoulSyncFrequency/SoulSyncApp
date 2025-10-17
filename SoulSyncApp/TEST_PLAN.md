# SoulSync – Test Plan (Pre-Release)

## 1) Health & Readiness
- GET /healthz → 200 { ok:true }
- GET /livez → 200 { live:true, pid, eventLoopDelayMs }
- GET /readyz:
  - Bez Postgres: 200 { ready:true, redis:true, postgres:false }
  - S Postgres (docker-compose): 200 { ready:true, redis:true, postgres:true }

## 2) Admin DLQ UI / API
- /admin/queues/ui → unesi x-admin-token
- Gumbi: Download JSON/CSV/XLSX (XLSX ima sheetove Summary + DLQ)
- Filter → pretražuje DLQ tablicu
- Purge bez "days" → obriše sve (potvrda + CSRF token prisutan)
- Purge s days=3 → obriše samo starije od 3 dana
- Prometheus: dlq_purged_total{queue} se povećava
- Audit log: "dlq_purge" pojave se u logs/

## 3) Admin Logs
- /admin/logs → vraća listu fajlova
- Download .log, .csv, .xlsx → uspješno, CSV/XLSX sadrži time, level, msg, requestId, ip
- Rate-limit: više od 20 req/min → 429

## 4) Observability
- /metrics → postoje: queue_*, therapy_primary_molecule_total, dlq_purged_total, process_*
- Grafana (compose.override) → dashboard učitan, paneli pokazuju promet

## 5) Security
- Headeri: CSP (prod), COOP/COEP, CORP, HSTS, Permissions-Policy
- CSRF na POST /admin/queues/:name/dlq (provjeri da bez tokena/CSRF vraća 403/invalid token)

## 6) OpenAPI
- npm run openapi:gen → backend/openapi/openapi.json generiran
- /api/docs → Swagger UI učitava minimalne rute; po potrebi proširi

## 7) CI
- Lint, format:check, type-check → prolaze
- Tests (Vitest) → prolaze, coverage upload na Codecov
- e2e (Playwright) → prolazi healthz spec
- Docker build job → prolazi

## 8) Docker & Compose
- docker compose up → backend+redis+postgres ok
- docker compose -f docker-compose.yml -f docker-compose.override.yml up → dodaje prometheus+grafana
