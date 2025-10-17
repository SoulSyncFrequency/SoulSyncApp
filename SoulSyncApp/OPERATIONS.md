

## Local & Staging with Docker Compose
### Dev
```bash
docker compose up --build
```
- API: http://localhost:3000
- Frontend: http://localhost:5173

### Prod-like
```bash
docker compose -f docker-compose.prod.yml up --build
```
- NGINX serves frontend `./frontend/dist`
- Backend on :3000 behind NGINX


## Additional Ops — POLISH20
- **Grafana**: dodani burn-rate alerti (1h i 6h prozori, prag 2%).  
- **ETag**: GET rute sada podržavaju `If-None-Match` (304) — smanjuje bandwidth i latenciju.  
- **Migration Guard**: CI job faila PR ako migracije sadrže destruktivne SQL naredbe (osim ako ručno označiš `MIGRATION_GUARD_ALLOW`).  
- **E2E Smoke (Playwright)**: ručni workflow (`E2E_BASE_URL` tajna) testira `/livez` i `/readyz`.  
- **Per-user rate-limit**: login/reset/verify rute ograničene po IP+email kombinaciji.


## Additional Ops — POLISH21
- **Slow request logging**: uključiti `ENABLE_SLOW_LOG=true` i po želji `SLOW_REQ_THRESHOLD_MS` (default 500).  
- **Concurrency limit**: uključiti `ENABLE_CONCURRENCY_LIMIT=true` i podesiti `CONCURRENCY_LIMIT` (default 5).  
- **HTTP Cache-Control**: uključiti `ENABLE_HTTP_CACHE=true` i `HTTP_CACHE_MAX_AGE` (sekunde, default 60).  


## Additional Ops — POLISH22 (Job Queue)
- **ENABLE_JOB_QUEUE=true** aktivira in-memory red za teške rute (heuristika: `X-Job-Queue: heavy` header ili path sadrži `generate|process|therapy|analysis|report` i metoda nije GET).
- **JOB_QUEUE_CONCURRENCY**: broj paralelnih jobova (default 2).
- **JOB_QUEUE_LIMIT**: maksimalna duljina reda (default 50). Kad se premaši → 429.
- Klijent dobiva **202 Accepted** i `X-Queue-Position` header dok čeka.
- Napomena: Ovo je **in-memory**; za horizontalni scale razmotriti Redis-backed queue.


## Additional Ops — POLISH23
- **Preload headers (NGINX)**: postavi `ENABLE_PRELOAD_HEADERS=true` za `Link: rel=preload` (glavni JS/CSS) kako bi ubrzao inicijalno učitavanje.
- **Log sampling**: `ENABLE_LOG_SAMPLING=true`, `LOG_SAMPLING_RATE=0.01` (default 1%), `SLOW_REQ_THRESHOLD_MS` (default 500ms). Errori i spori zahtjevi se uvijek logiraju; normalni se logiraju probabilistički.


## Additional Ops — POLISH24
- **Burst-aware rate limiting** (token bucket): uključiti `ENABLE_BURST_LIMIT=true`.
  - `BURST_LIMIT` (default 10): maksimalno zahtjeva u burstu po korisniku/IP-u/putanji.
  - `BURST_WINDOW_MS` (default 10000): vrijeme refilla “kante” do punog limita.
- 429 s `Retry-After` headerom kad se kanta isprazni.
- Radi zajedno s postojećim per-user rate limitom i globalnim limiterima.


## Additional Ops — POLISH26 (Observability)

### Prometheus metrics — Queue
- `queue_jobs_current{state}` — broj jobova po stanju (waiting, active, completed, failed, delayed, paused)
- `queue_jobs_completed_total` — ukupno dovršenih jobova
- `queue_jobs_failed_total` — ukupno neuspjelih jobova
- `queue_job_duration_seconds` — histogram trajanja jobova

**Primjeri alertova:**
```
sum by(state) (queue_jobs_current{state="failed"}) > 10
rate(queue_jobs_failed_total[5m]) > 0.1
histogram_quantile(0.95, sum(rate(queue_job_duration_seconds_bucket[5m])) by (le)) > 5
```

### Prometheus metrics — API cache
- `api_cache_hits_total{source="memory|redis"}`
- `api_cache_misses_total`

**Primjeri alertova:**
```
rate(api_cache_misses_total[5m]) / (rate(api_cache_hits_total[5m]) + 1e-9) > 0.5
```


## Admin DLQ pregled (read‑only)
- Route: `GET /admin/queues` i `GET /admin/queues/:name/dlq`
- Guard: `x-admin-token` mora odgovarati `ADMIN_TOKEN` ENV varijabli.
- Prikaz: osnovna agregacija dubine redova + prvih 50 DLQ jobova po queue-u.

## Grafana dashboard
- Datoteka: `infra/monitoring/grafana/dashboards/queues_and_primary_molecule.json`
- Pruža statove za *waiting*, *rate* grafove za completed/failed, heatmap za trajanje i brojače za primary‑molecule valid/fallback.


## Admin UI (read-only HTML)
- `GET /admin/queues/ui` — mini HTML sučelje za pregled queue stanja i DLQ-a. Token se upisuje u polje i šalje kao `x-admin-token`.

## Security / Auth
- **ENV**: `ADMIN_TOKEN` (za `x-admin-token`), ili `ADMIN_USER` + `ADMIN_PASS` (BasicAuth).  
- `/admin/*` rute i `/api/metrics` mogu se čuvati na oba načina.

## DLQ cleanup (cron)
- **ENV**: `DLQ_TTL_DAYS` (zadano 7). Čisti `<queue>:dlq` starije od TTL-a svaka 6 h.
- Kod: `backend/src/cron/dlqCleanup.ts` (pokreće se u `server.ts`).

## Grafana provisioning
- Provisioning YAML datoteke su u `infra/monitoring/grafana/provisioning/...`
- Dashboard JSON: `infra/monitoring/grafana/dashboards/queues_and_primary_molecule.json`
- Pretpostavlja `Prometheus` kao `http://prometheus:9090` (promijeni po potrebi).

## ENV pregled (novo/bitno)
- `ADMIN_TOKEN` – token za admin JSON/UI rute
- `ADMIN_USER`, `ADMIN_PASS` – alternativno BasicAuth
- `DLQ_TTL_DAYS` – TTL za DLQ čišćenje (dani)


## Admin DLQ dodatno
- **Download DLQ**: `GET /admin/queues/:name/dlq?download=1` → preuzimanje svih jobova u JSON fajlu.
- **Purge DLQ**: `POST /admin/queues/:name/dlq?purge=1` → briše sve jobove u DLQ (do max 50 prikazanih).  
  - Potrebno je postaviti ENV `ADMIN_PURGE_ENABLED=true` da bi purge radio.
- UI `/admin/queues/ui` ima gumbe **Download JSON** i **Purge DLQ** za praktično korištenje.


### Purge DLQ s opcijom `days`
- `POST /admin/queues/:name/dlq?purge=1&days=N` → briše samo jobove starije od **N dana**.
- Ako `days` nije zadano → briše sve jobove (trenutno ponašanje).
- UI ima input polje "days (optional)" pored gumba Purge DLQ.


### DLQ Download u CSV
- `GET /admin/queues/:name/dlq?download=csv` → preuzima DLQ u CSV formatu (`id,name,error,data`).  
- UI `/admin/queues/ui` sada ima i gumb **Download CSV** pored **Download JSON**.


### DLQ Download u XLSX
- `GET /admin/queues/:name/dlq?download=xlsx` → preuzima DLQ u Excel `.xlsx` formatu.  
- Sheet `DLQ` ima kolone `id`, `name`, `error`, `data`.  
- UI `/admin/queues/ui` sada ima i gumb **Download XLSX**.


### XLSX Summary+DLQ
- `GET /admin/queues/:name/dlq?download=xlsx` → vraća Excel s 2 sheeta:
  - **Summary**: stanje oba queue-a (`waiting/active/delayed/failed/paused/total`)
  - **DLQ**: detalji (id, name, error, data, timestamp, attempts, processedOn, finishedOn)
- Error se truncira na 500 znakova, data je JSON string.

### DLQ purge metrike
- `dlq_purged_total{queue}` counter inkrementira se na svako brisanje (manualno i cron).
- Grafana panel: `sum(rate(dlq_purged_total[5m])) by (queue)`.

### Admin UI
- Preporučeni export format = **XLSX** (gumb bold + zelen).
- JSON i CSV gumbi ostaju za fallback.


## Health endpoints
- `/healthz` (always OK), `/livez` (process alive), `/readyz` (provjerava Redis/queue konekciju).

## ESLint/Prettier/CI
- Konfiguracija u root repo-u (`.eslintrc.json`, `.prettierrc`), CI workflow `.github/workflows/ci.yml` (lint, format:check, type-check, test).

## PR Template & CODEOWNERS
- `.github/pull_request_template.md`, `.github/CODEOWNERS`

## OpenAPI glavnog API-ja
- `/api/openapi.json` + `/api/docs` (Swagger UI).

## Admin hardening
- `express-rate-limit` limiter na admin rutama (20 req/min).
- Purge audit log ide u `logger.info` s metapodacima (by: token/basic, count, queue, days).


## v10 Upgrades
- **Event loop & process metrics**: `process_event_loop_delay_ms`, `process_rss_bytes`, `process_heap_used_bytes`, `process_external_memory_bytes`. `/livez` vraća i `eventLoopDelayMs`.
- **OpenAPI (Zod → OpenAPI) scaffolding**: `backend/scripts/gen-openapi.ts` + script `npm run openapi:gen`. Output ide u `backend/openapi/openapi.json`.
- **Docker & Compose**: `backend/Dockerfile` (multi-stage), `docker-compose.yml` (redis+backend), `render.yaml` za Render deploy.
- **CI/CD**: Docker build job, npm audit, Codecov upload (`.codecov.yml`).
- **Admin UI filter**: input polje za filter preko DLQ tablice.



## v11 Upgrades
- **Postgres** u `docker-compose.yml` (servis `postgres`, default credsi) + `/readyz` provjera PG ako je `DATABASE_URL` postavljen.
- **Pino logger** s `x-request-id`/UUID, access/app/audit logovi, **rotacija** (rotating-file-stream), `/admin/logs` list/download (JSON/CSV/XLSX).
- **Admin Logs rute**: 
  - `GET /admin/logs` → lista log fajlova
  - `GET /admin/logs/:name` → raw view
  - `GET /admin/logs/:name/download?format=json|csv|xlsx` → export
- **OpenAPI Update**: `/livez` dokumentiran s event loop detaljem; scaffold za Zod→OpenAPI generator ostaje u `backend/scripts/gen-openapi.ts`.


## Postgres (opcionalno)
- `POSTGRES_URL` ako je postavljen → `/readyz` provjerava i Postgres (SELECT 1).
- `docker-compose.yml` dodaje `postgres:15-alpine` i injecta `POSTGRES_URL` u backend.

## Logger
- **Pino** s `requestId` (`x-request-id` ili `nanoid`) i rotacijom (`LOG_DIR` env, gzip dnevno).  
- Rute za preuzimanje logova: `/admin/logs`, `/admin/logs/:file`, `/admin/logs/:file.csv`, `/admin/logs/:file.xlsx`.

## OpenAPI generator
- `npm run openapi:gen` generira `backend/openapi/openapi.json` iz Zod registry (scaffold).  
- Proširi generator importima stvarnih schema i registracijom ruta.



## v13 Upgrades
- **RBAC tokens**: `ADMIN_TOKENS="alice:AAA,bob:BBB"` → guard prepoznaje više tokena i audit log bilježi `user`.
- **Admin logs rate-limit**: `adminLimiter` i audit eventi za svaki download (json/csv/xlsx).
- **Log retention**: `LOG_TTL_DAYS` (zadano 30), cron `startLogsCleanup()` briše staro u `LOG_DIR`.
- **OpenAPI gen (scaffold+)**: `gen-openapi.ts` registrira i `PrimaryMoleculeMetaSchema` (proširi po potrebi).
- **Tests**: `vitest` (unit) i `playwright` (e2e /healthz). CI jobovi pokrivaju run + coverage.


## v20 – Build & Runtime polish
- **Build pipeline**: `npm run build` (tsc to `dist/`), `npm start` runs `node dist/server.js`.
- **Docker**: builds TypeScript, copies only `dist/` + `node_modules` → manji image, brži start.
- **CORS & compression**: CORS reguliran `CORS_ORIGINS` (CSV lista, `*` dozvoljen); gzip enabled.
- **Global error handler**: uniformni JSON error odgovor.
- **Graceful shutdown**: zatvara HTTP i Redis konekciju na SIGINT/SIGTERM.
- **CSRF cookie hardening**: `SameSite=Strict`, `HttpOnly`, `Secure` u produkciji.
- **DLQ pagination**: `GET /admin/queues/:name/dlq?offset=0&limit=50` + UI gumb **Load more**.


### v20 Hardening
- **CSRF**: `/admin/csrf` sada koristi `csrfProtection` (cookie: httpOnly, sameSite=strict, secure u produkciji).
- **Purge**: batchira DLQ u segmentima od 200 dok ne pročita sve jobove (više nije limitirano na 50).
- **Purge validation**: `days` mora biti broj ≥ 0 (inače 400).
- **Admin UI cache**: `Cache-Control: no-store` kako bi se izbjeglo keširanje osjetljivih podataka/tokena.


### v21 Production Build + CSP Nonce
- **Dockerfile**: multi-stage (builder + slim runner), runs compiled `dist/` with production deps only.
- **NPM Scripts**: `npm run build` (tsc), `npm run start:prod` (dist).
- **Admin UI**: adds random CSP nonce per request, CSP header `script-src 'self' 'nonce-<nonce>'`, inline scripts tagged with nonce.


### v21 Production build + CSP Nonce
- **Production build**: `npm run build` (TS -> `dist/`), Dockerfile koristi `node dist/server.js` i `npm ci --omit=dev` za manji image.
- **CSP nonce (Admin UI)**: `/admin/queues/ui` sada postavlja `Content-Security-Policy` s `script-src 'self' 'nonce-<random>'` i dodaje `nonce` na `<script>` tagove.


### v22 – Final hardening & polish
- **Dependencies**: ensured `swagger-ui-express`, `compression`, and `typescript` present.
- **TypeScript**: `strict` mode + `noImplicitAny`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`.
- **Server**: disabled `x-powered-by`, added `compression()`, body size limits (`1mb`), and **graceful shutdown** on SIGTERM/SIGINT (closes HTTP + Redis connection).
- **Admin queues**: allow-list validacije (`webhookQueue`, `emailQueue`) za `:name` parametar.


### v24 – Config, CORS, Errors, Metrics token, Healthcheck
- **Config loader**: `src/config.ts` (Zod) type-safe ENV validacija + defaulti; koristi se u `server.ts`.
- **CORS**: `CORS_ORIGINS` (CSV) → strogo dopušteni origin-i preko `applyCors(...)`.
- **Error handling**: globalni `notFound` (404) i `errorHandler` (JSON); process-level `unhandledRejection/uncaughtException`.
- **/metrics guard**: opcionalna zaštita `Authorization: Bearer $METRICS_TOKEN` ako je definirano.
- **Docker HEALTHCHECK**: koristi `/healthz` za runtime nadzor containera.
- **Test**: bazni unit test za queue allow-list prisutan.


### v25 – Maintenance & Flags
- **Dependabot**: `.github/dependabot.yml` weekly updates for npm (backend) + GitHub Actions.
- **Rate-limit**: `/metrics` (30/min), `/api/docs` (10/min).
- **Server timeouts**: set keepAliveTimeout=62000, headersTimeout=65000 for ALB/NGiNX safety.
- **Admin UI flag**: `ADMIN_UI_ENABLED=false` → disables `/admin/queues/ui` (returns 404).


### v25 – Maintenance, limits & flags
- **Dependabot**: `.github/dependabot.yml` za npm i GitHub Actions (weekly).
- **Rate-limits**: `/api/docs` (10/min/IP) i `/metrics` (30/min/IP) uz postojeći admin limiter.
- **HTTP timeouts**: `keepAliveTimeout=62s`, `headersTimeout=65s` kod starta servera.
- **Feature flag**: `ADMIN_UI_ENABLED` (`true`/`false`) – kad je `false`, `/admin/queues/ui` vraća 404.


### v26 – Deployment, tracing & release polish
- **Deployment guide**: DEPLOYMENT.md (Render, Docker, Kubernetes manifesti).
- **.gitignore**: dodane dist/, .env, coverage/, playwright-report/.
- **Husky hook**: pre-commit provjerava lint, type-check, i zabranjuje console.log.
- **Tracing middleware**: src/middleware/tracing.ts dodaje traceId (x-trace-id) i integrira s OpenTelemetry API.
- **Release Drafter**: .github/release-drafter.yml za automatske GitHub release notes.


### v26 – Deployment, Tracing & Release hygiene
- **Deployment guide**: `DEPLOYMENT.md` s Render/Docker/Kubernetes uputama i YAML primjerima.
- **.gitignore** dopunjena (dist, .env, logs, coverage, playwright-report, *.log).
- **Husky + lint-staged**: pre-commit blokira `console.log(` i osjetljive `process.env.SECRET/TOKEN/KEY` reference.
- **Tracing stub**: `x-trace-id` header i logger child s `traceId`; middleware `tracingMiddleware` dodan rano.
- **Release Drafter**: `.github/release-drafter.yml` za automatske release note.


### v27 – Deploy & SRE upgrades
- **GHCR publish**: `docker-publish.yml` – build & push image na GHCR na tag `v*.*.*`.
- **Helm chart**: `charts/soulsync` (Deployment/Service/Secrets/values).
- **Prometheus alerts**: `infra/monitoring/prometheus/alerts.yml` + uključeno u `prometheus.yml`.
- **Render vodič**: `RENDER_GUIDE.md` – korak-po-korak deploy.
- **Readiness gate**: opcionalno (`READINESS_GATE=true`) blokira non-admin/API pozive dok Redis nije spreman.


### v28 – Environments, Docs & CSP telemetry
- **Helm values**: `values-staging.yaml` i `values-production.yaml` (različiti limiti i flagovi).
- **Grafana alerting**: provisioning primjer `provisioning/alerting.yml` (email contact point + policy).
- **/api limiter**: globalni limiter za `/api/*` (default 100/min, podesivo `API_RATE_LIMIT`).
- **OpenAPI YAML export**: `npm run openapi:yaml` → `openapi/openapi.yaml`.
- **CSP report-only**: `CSP_REPORT_ONLY=true` dodaje `Content-Security-Policy-Report-Only` i endpoint **POST /csp-report** (logira izvješća).
- **Release Drafter workflow**: automatsko ažuriranje draft release-a na push/PR.


### v29 – Security & Ops hardening
- **Docker (runner)**: non-root user (UID 1001), `LOG_DIR=/app/logs`, owned dir; container runs as **appuser**.
- **Helm**: `securityContext` (non-root + readOnlyRootFilesystem), `emptyDir` mount za `/app/logs`.
- **K8s**: PodDisruptionBudget, HPA (CPU 70%), NetworkPolicy (ingress TCP/80 example).
- **Runbook**: `RUNBOOK.md` s najčešćim procedurama i incident response kratkim uputama.
- **.nvmrc**: pin na Node 20.
- **Trivy**: CI workflow za image vulnerability scan na PR-ovima.


### v31 – Status & Release
- **Status page**: `status/index.html` – minimal static page for App/Play Store reviewers.
- **Uptime Kuma skeleton**: `uptime-kuma/docker-compose.yml` + README for optional real monitoring.
- **Release PR highlights**: extended section in `RELEASE_PR.md`.
- **Makefile**: targets `build`, `test`, `release`, `helm-upgrade`.
- **release.sh**: automates build/test/push/helm upgrade/tagging.


### v33 – Advanced hardening
- **Stricter CSP**: removes unsafe-inline unless `ALLOW_UNSAFE_INLINE=true`.
- **DB migrations**: skeleton in `backend/db/migrations`, scripts `migrate:dev/prod`.
- **Structured errors**: `AppError`, errorHandler, `ERROR_CODES.md`.
- **Sensitive data redaction**: middleware masks tokens/passwords in logs.
- **Contract tests**: skeleton in `tests/contracts`, GH workflow `contract-tests.yml`.
- **Feature flags**: `featureFlag()` util, `FEATURE_FLAGS.md` doc.


### v33 – Security++ & Flags
- **CSP strict**: uklonjen `unsafe-inline` iz style-src; nonce je standard. Dev override: `ALLOW_UNSAFE_INLINE=true` (privremeno).
- **DB Migrations (skeleton)**: `db/migrations/*.sql` + `npm run migrate:*` skripte (placeholder runner).
- **AppError**: strukturirane greške (`code`, `httpStatus`) + `ERROR_CODES.md` tablica.
- **Redaction**: middleware skriva osjetljiva polja (password/token/secret/key) iz requesta prije logiranja.
- **Feature flags**: `featureFlag()` + primjer na admin purge ruti (`FEATURE_SAFE_PURGE`).
- **Contract tests**: skeleton provjera `/api/openapi.json` u CI.
