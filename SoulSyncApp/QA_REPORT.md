# QA Report – SoulSync v18 (Finalized)

## Environment
- Commit / Tag: v1.0.0
- Node version: 20.x
- Platform: Linux (Ubuntu 22.04, Docker)
- Docker: yes (backend + redis + postgres + prometheus + grafana)

## Tests Summary
- Unit (Vitest): ✅ pass (100% ran)
- e2e (Playwright): ✅ pass (healthz, admin UI, csrf purge, logs export, metrics)
- Coverage: uploaded to Codecov (see badge)

## Checks
- Health endpoints: ✅ OK  
  - `/healthz` → 200 `{ ok:true }`  
  - `/livez` → 200 `{ live:true, pid, eventLoopDelayMs }`  
  - `/readyz` → 200 `{ ready:true, redis:true, postgres:true }`

- Admin UI (DLQ): ✅ OK  
  - JSON/CSV/XLSX download radi, XLSX ima **Summary + DLQ**  
  - Filter pretražuje tablicu ispravno  
  - Purge (bez days) → obrisani svi jobovi  
  - Purge (days=3) → obrisani samo stariji jobovi  
  - Prometheus `dlq_purged_total{queue}` raste nakon purge  
  - Audit log bilježi akcije (korisnik + queue + count)

- Admin Logs: ✅ OK  
  - `/admin/logs` vraća listu fajlova  
  - CSV i XLSX export rade (CSV sadrži `time, level, msg, requestId, ip`)  
  - Rate-limit aktivan (više od 20 req/min → 429)

- Metrics (/metrics): ✅ OK  
  - `queue_depth`, `dlq_purged_total`, `therapy_primary_molecule_total`, `process_*` svi prisutni

- Grafana dashboard: ✅ OK  
  - Paneli prikazuju queue depth, purge rate, job durations, memory/event loop delay

- Security: ✅ OK  
  - CSP, COOP/COEP, CORP, HSTS, Permissions-Policy svi headeri prisutni  
  - CSRF enforced na POST purge (bez tokena → 403)  
  - RBAC: `ADMIN_TOKENS` radi, audit log pokazuje korisničko ime  
  - Rate-limits rade na admin rutama

- Log rotation & retention: ✅ OK  
  - Log fajlovi rotiraju dnevno, gzipirani  
  - Stariji od 30 dana brisani automatski (cron job testiran s manjim TTL)

- OpenAPI: ✅ OK  
  - `npm run openapi:gen` generira `backend/openapi/openapi.json`  
  - `/api/docs` prikazuje sve rute (health, therapy, admin, logs, metrics)  
  - Autoscan fallback pokrio sve rute bez Zod definicije

- CI/CD: ✅ OK  
  - `lint`, `type-check`, `format:check` prolaze  
  - Unit + e2e testovi prolaze, coverage uploadan  
  - Docker build job prolazi  
  - Release workflow na tag `v1.0.0` kreirao GitHub Release s auto notes

## Notes
- QA stack (`docker-compose.override.yml`) s Prometheus + Grafana radi iz prve.  
- Admin UI user experience: minimalan ali funkcionalan; token i CSRF dobro integrirani.  
- Preporuka: dugoročno dodati još par “happy path” e2e testova za **therapy endpoint** kad bude potpuno definiran.
