# Deploy Runbook (Prod/Staging)

## Pre-deploy checks
1. `GET /ops/version` — provjeri `version` i `openapiSha256`.
2. `GET /health` i `/ready` — moraju vratiti 200.
3. `GET /ops/status?window=15m` — bez kritičnih `anomalyHints`.
4. `GET /ops/config-lint` — riješi `warn` stavke ako možeš.
5. `GET /ops/release-notes` — provjeri izmjene i per-method statistiku.
6. `GET /ops/top-errors?window=15m` — nema novih abnormalnih signature-a.
7. `GET /ops/top-routes?window=15m` — p95 u granicama SLO.

## Deploy
- Rolling/blue-green prema vašoj platformi.
- Nakon svakog koraka: pokreni **Smoke Test** (vidi `ops/smoke_test.sh`).

## Post-deploy verifikacija (15–30 min)
- `/ops/status?window=15m` → bez “High 5xx”/“High avg latency” hintova.
- `/ops/slo-status?window=60m` → `ok=true` (ispod ciljanih pragova).
- `/ops/top-errors?window=15m` → bez skokova.
- Dashboard (admin) → provjeri sparkline i RCA hints.

## SLO ciljevi (početni)
- **Availability**: 99.9% (mjereno kao (1 - 5xx rate)). Prag: `errorRate < 0.001` u 30d, alarmno > 1% u 15m.
- **Latency**: p95 < **500 ms**, p99 < **1500 ms** na ključnim rutama u 15m prozoru.
- **Incident alarm**: `errorRate > 5%` **ili** `avgLatency > 500 ms` u 15m → automatski alert.

## Incident playbook (sažetak)
1. **Detekcija**: CI alert, `/ops/anomaly-hints`, `/ops/top-errors`, Sentry/Prometheus.
2. **Stabilizacija**: Uključi maintenance mode (ako je potrebno), skaliraj replike, provjeri DB/Redis pingeve i latencije.
3. **Dijagnoza**: `/ops/rca-hints`, `/ops/top-routes`, `/ops/metrics/export` (CSV), Sentry recent issues, slow query log.
4. **Ublažavanje**: Feature flags (disable), rate-limit *loosen* kratkoročno (*ako ima potrebe*), roll-back na zadnji dobar release.
5. **Komunikacija**: `/admin/ops/notify` → ops tim, incident kanal.
6. **RCA & remedijacija**: ispuniti RCA zapisnik, dodati test/snapshot, update docs.

## Rollback
- Vratiti prethodni tag (provjeri `/ops/version`), validirati preko Smoke Test-a i SLO statusa.
