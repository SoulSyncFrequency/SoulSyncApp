# SoulSync — Deployables & Ops Kit (v101.0.0)

## Quick start (Docker Compose)
```bash
cd ops
cp .env.backend .env.backend.local   # edit credentials in .env.backend
docker compose up -d --build
```

Services:
- `backend` on http://localhost:8080
- `frontend` on http://localhost:5173
- `redis` on localhost:6379
- `prometheus` on http://localhost:9090
- `grafana` on http://localhost:3000
- `loki` on http://localhost:3100
- `promtail` shipping logs from ../logs to Loki

> Napomena: Backend zapisuje log u `../logs/app.log` (preko `LOG_TO_FILE=true`). Promtail ga šalje u Loki.

## Healthchecks
- Backend health: `GET /api/healthz`
- Frontend (nginx): root `GET /`

## Metrics
- `GET /api/metrics` (zaštićen tokenom, Basic Auth ili lokalnom IP)

## Logs
- Preuzmi trenutni log: `GET /api/admin/logfiles/current` (guardirano)

## SLO Config
- UI: `/admin/slo-config` (guardirano)

## CI (GitHub Actions)
- Minimalni Playwright skeleton: `.github/workflows/e2e.yml`
- Po potrebi dodaj `docker compose up -d` i seed podatke prije testa.

## Production tips
- Koristi managed DB (Postgres), tajne preko vault/secrets managera
- Uključi HTTPS (reverse proxy/ingress)
- Backup strategija za DB i Redis snapshots
- Alerting u Grafani (na `/api/metrics` podatke)

## Integrity & Verification (v101.2.20)
- Public key endpoint: `GET /api/integrity/public-key`
- Minimal integrity API: `GET /api/integrity` (returns version, timestamp, short hash, proof, status)
- Frontend pages:
  - `/integrity` — public minimal list (no sensitive data)
  - `/verify` — paste QR JSON or upload image → local signature verification

## Grafana provisioning
- Datasources, dashboards and alert rules are auto-provisioned by docker-compose mounts.
- Dashboard file: `ops/grafana-dashboards/soulsync-observability.json`
- Loki alert rules: `ops/grafana-alerts/loki-errors.json`
- Prometheus rules: `ops/prometheus-alerts.yml` (linked in `ops/prometheus.yml`)



## Grafana CLI (v101.3.0)
Set env before use:
```
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_API_KEY="YOUR_API_KEY"
```
Commands:
```
node ops/grafana-cloud/soulsync-grafana-cli.js status
node ops/grafana-cloud/soulsync-grafana-cli.js export
node ops/grafana-cloud/soulsync-grafana-cli.js diff
node ops/grafana-cloud/soulsync-grafana-cli.js deploy   # safe-mode by default
node ops/grafana-cloud/soulsync-grafana-cli.js rollback
```
Notes:
- Screenshots require Playwright (`npm i -D @playwright/test && npx playwright install`).
- PDF generation attempts to use `pdfkit`; if unavailable, a placeholder file is created.
- Signing uses RSA-SHA256 with keys in `ops/grafana-cloud/signing/`.


### Notes (v101.3.1 hardening)
- Grafana datasources now have explicit UIDs: `prometheus` (default) i `loki` — dashboards/alerts ih referenciraju po UID-u.
- Alertmanager koristi `${ALERT_WEBHOOK_URL}` kroz `envsubst` wrapper (dodaj u shell env ili .env file prije `docker compose up`).



## CI quality gate (v101.3.2)
- Added `.github/workflows/lint-config.yml`
- Validates all `.yml`, `.yaml`, `.json` files in `ops/**` on every push/PR
- Blocks merge if syntax errors are found (safe-guard for configuration integrity)


## CI build gate (v101.3.3)
- Added `.github/workflows/lint-build.yml`
- On each push/PR:
  - Installs deps in backend + frontend
  - Runs `eslint` on both
  - Runs `tsc --noEmit` on backend
  - Runs `vite build` on frontend
- Blocks merge if code has lint/type/build errors


## Unit Tests (v101.3.4)
- Added Vitest to frontend & backend
- Test files live alongside code as `*.test.ts(x)`
- Starter tests included (Sample component, useMagic hook, math util, /ping API)
- Coverage thresholds: 80/80/70/80
- `.env.test` files for isolated environment
- CI workflow `.github/workflows/tests.yml` runs tests on every push/PR and uploads coverage reports


## Codecov (v101.3.5)
- Added `codecov.yml` config and `.github/workflows/codecov.yml` CI job
- On each push/PR runs tests and uploads `lcov.info` to Codecov
- To enable:
  1. Sign in to [https://codecov.io](https://codecov.io) with GitHub
  2. Add this repo
  3. Get `CODECOV_TOKEN` from Codecov project settings
  4. Add it to GitHub → Settings → Secrets → Actions → `CODECOV_TOKEN`
- Badge is in root `README.md`


## Codecov gate (v101.3.6)
- Updated `codecov.yml` to enforce 80% minimum coverage on all pull requests
- If coverage < 80%, Codecov will mark the PR as failed (blocks merge)
- This applies only to PRs (not direct pushes to main)


## Developer Experience (v101.3.7)
- Root ESLint/Prettier config (.eslintrc.cjs, .prettierrc.json, .editorconfig)
- Repo templates: ISSUE/PR templates, SECURITY.md
- Keygen helper: `ops/generate_signing_keys.sh`
- E2E skeleton: Playwright config + sample spec in `tests/e2e/` (optional)
- Makefile handy targets: `make up`, `make down`, `make lint`, `make test`



## E2E Tests (v101.3.8)
- Added `.github/workflows/e2e.yml` for Playwright tests
- Disabled by default — runs only when you:
  1. Create `E2E_BASE_URL` secret in GitHub (e.g. staging URL)
  2. Trigger workflow manually (Actions → E2E Tests → Run workflow)
- Saves screenshots, videos and HTML report as artifacts
- E2E tests live in `tests/e2e/`


## Enterprise Hardening (v101.3.9)
- ✅ Secrets scan via Gitleaks (`.github/workflows/secrets-scan.yml`)
- 📦 Docker build & push to GHCR (`.github/workflows/docker.yml`)
- 🧩 SBOM + vulnerability scan via Trivy (`.github/workflows/security-scan.yml`)
- ⚡ TypeScript strict mode enabled in frontend/backend
- 📝 Conventional commits enforced (`.commitlintrc.json`)
- 📑 Automatic changelog generation (`.github/workflows/changelog.yml`)


## Guardrails++ (v101.4.0)
- Backend middleware:
  - `express-rate-limit` (default 30 req/min/IP; override via `RATE_LIMIT_MAX`)
  - Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
  - Audit logger (method, URL, status, latency, IP)
  - Zod validation for `/api/logs` query (`backend/src/schemas.ts`)
- Frontend validation:
  - Zod schema for Logs filters (`frontend/src/lib/validation.ts`) + preflight validation in `/logs`


## Guardrails Final (v101.4.0)
- ✅ Global error handler (`middleware/errorHandler.ts`)
  - Catches all uncaught errors
  - Returns structured JSON with `error`, `details`, `traceId`
- ✅ ApiError class (`ApiError.ts`) for consistent error throwing
- ✅ validateRequest wrapper (`middleware/validateRequest.ts`) combines Zod validation + try/catch
- ➜ Backend can no longer crash on bad input; all errors go through handler


## Deep Hardening (v101.4.1)
- Request ID middleware (`X-Request-Id`) for every request
- CORS allowlist via `CORS_ORIGIN` (comma-separated or `*`)
- Prometheus metrics at `/api/metrics` with:
  - `http_requests_total{method,route,status}`
  - `http_request_duration_seconds{...}`
  - `errors_total{type}`
- Health endpoints: `/api/healthz`, `/api/readiness`
- Frontend ErrorBoundary (global UI fallback)
- Enhanced fetchWithRetry: timeout + jitter + headers
- Example env file: `ops/.env.backend.example`
- Restart policies for Docker services (unless-stopped)


## Pre-deploy self-check (v101.4.2)
- Script: `ops/predeploy-check.ts`
  - Validates `.env.backend` via Zod config schema
  - Hits `/api/healthz`, `/api/readiness`, `/api/metrics`
  - Exits 1 if any check fails
- Run locally:
  ```bash
  cd backend
  CHECK_BASE_URL=http://localhost:8080 npm run predeploy:check
  ```
- CI: `.github/workflows/predeploy-check.yml` (manual dispatch)
  - set `CHECK_BASE_URL` in repo secrets


### Start scripts (backend)
- `npm run dev` → start TS server (ts-node)
- `npm run build` → compile TypeScript to `dist/`
- `npm start` → run compiled server (`dist/server.js`)

### Pre-deploy check usage
- Local:
  ```bash
  cd backend
  # ensure ops/.env.backend exists (copy from ops/.env.backend.example)
  CHECK_BASE_URL=http://localhost:8080 npm run predeploy:check
  ```


## ULTRA layer (v101.5.0)
- **Watchdog**: `ops/watchdog.sh` + `docker-compose` service — restarts services on repeated health failures.
- **Config snapshot/restore**: `ops/config-snapshot.sh`, `ops/config-restore.sh`.
- **Immutable images**: Docker workflow tags images by commit SHA (`:sha-<GITHUB_SHA>`). 
- **Image signing (optional)**: Cosign step in CI if `COSIGN_KEY`/`COSIGN_PASSWORD` secrets are set.
- **Dependencies upkeep**: `renovate.json` (activate Renovate app on repo).
- **Architecture knowledge base**: `docs/adr/*` with template and first ADR.


## Final Polish (v101.5.1)
- Compression enabled on backend responses
- Metrics/health endpoints bypass rate limiter (Prometheus-friendly)
- `/api/version` endpoint for build introspection
- Standard JSON 404 for `/api/*`
- Enriched audit logs (request id, user-agent)
- Frontend wrapped with `React.StrictMode`
- Graceful shutdown hooks (SIGTERM/SIGINT)


## Hardening Additions (v101.5.2)
- Express `trust proxy = 1` (accurate client IP behind reverse proxy)
- Hide `X-Powered-By` header
- JSON body limit `1mb` (DoS protection)
- Global `Cache-Control: no-store` for `/api/*`
- CSP (Report-Only) headers + `/api/csp-report` endpoint
- Unhandled error hooks for process-level safety
- Predeploy check also validates `/api/version`
- Watchdog restart compatible with Docker Compose v1/v2


## Ultra Final (v101.5.3)
- CORS tunables via env: `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`
- Optional HSTS (`ENABLE_HSTS=true`, `HSTS_MAX_AGE=15552000`) — only applied behind HTTPS (via `x-forwarded-proto`)
- Extra security headers: `Cross-Origin-Resource-Policy: same-site`, `Cross-Origin-Opener-Policy: same-origin`
- JSON logs toggle: `LOG_FORMAT=json` (structured logs for SIEM)
- Response timing headers: `X-Response-Time`, `Server-Timing`
- Exposes `/.well-known/security.txt`
- Enforced Node versions in FE/BE `package.json` (`engines.node: >=18 <=22`)


## Ultra² (v101.5.6)
- HPP protection (`hpp()`) against HTTP parameter pollution
- `Origin-Agent-Cluster: ?1` header for stronger isolation
- API docs at `/api/docs` (Swagger UI rendering `ops/openapi.yaml`)
- Default JSON headers for all `/api/*` responses
- Rate-limit bypass for `/api/docs` and `/api/openapi.yaml`
- `engineStrict: true` in backend to enforce Node range
- Graceful-close scaffold for SIGTERM


## Ultra³ (v101.5.7)
- Fixed `Server-Timing`/`X-Response-Time` to set headers before send (accurate timings)
- Removed incorrect default `Accept`/`Content-Type` setter on `/api/*`
- `build_info` initialization now uses `require()` (no top-level await)
- Disabled ETag to avoid stale API caches
- Swagger UI CDN links include SRI attributes (placeholders)
- Docker healthcheck for backend service
- Added k6 smoke test: `BASE_URL=http://localhost:8080 k6 run ops/perf/k6-smoke.js`


## Sentry (v101.5.8)
- Backend: integrated @sentry/node + profiling
- Frontend: integrated @sentry/react + BrowserTracing + Replay
- Placeholder DSN in `.env.backend.example` and VITE_ vars for frontend
- Default environment: staging
- Release: v101.5.7
- Sensitive data (auth headers, cookies, tokens) sanitized before sending


### Release Checklist (summary)
- Fill `ops/.env.backend` and `ops/.env.frontend`
- Run pre-deploy check: `cd backend && CHECK_BASE_URL=http://localhost:8080 npm run predeploy:check`
- Start stack: `cd ops && docker compose up -d --build`
- Smoke: `/api/healthz`, `/api/metrics`, `/api/version`, `/api/docs`
- Optional: k6 smoke `BASE_URL=... k6 run ops/perf/k6-smoke.js`
- Tag and release; enable branch protection


## Ultra⁴ (v101.5.10)
- Sentry backend init **gated**: ne pokreće se na placeholder DSN-u; `sendDefaultPii=false`; sample rate kroz env
- Sentry FE **gated** i **Replay opcionalan** (`VITE_SENTRY_REPLAY=false` by default)
- `/api/csp-report` zaštićen **rate-limitom** (20/min/IP) protiv spama
- Dodan **security CI** workflow: Gitleaks (secrets) + Trivy (ranjivosti)
- Dodan healthcheck za frontend servis (ako postoji u compose)
- Env primjeri dopunjeni (`SENTRY_TRACES_SAMPLE_RATE`, `VITE_SENTRY_TRACES_SAMPLE_RATE`, `VITE_SENTRY_REPLAY`)


## Ultra⁶ (v101.5.12)
- **COEP-Report-Only** header (`Cross-Origin-Embedder-Policy-Report-Only: require-corp`) — siguran “observe-first” korak prema cross-origin izolaciji
- **Healthz bogatiji**: `uptime` (sekunde) i `memory` (`rss`, `heapUsed`)
- **Docker logging rotation**: `json-file` s `max-size=10m`, `max-file=3` za backend/frontend
- **.editorconfig** i **.nvmrc (20)** — dosljedan dev environment i stil
- **Makefile `sentry-test`** target za brzu provjeru Sentry pipeline-a
- **Predeploy check**: potvrđuje `uptime` u `/api/healthz`
