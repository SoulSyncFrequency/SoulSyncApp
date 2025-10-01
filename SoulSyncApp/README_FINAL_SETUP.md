# ✅ SoulSync — Final Store Release Setup (Universal v73)

## One-time secrets
- `GOOGLE_PLAY_JSON` (Play service account JSON)
- `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY` (Apple API key)

## Release flow
```bash
npm run release:store -- minor
git push origin vX.Y.Z
```
CI will build, upload to Play (draft, 10% rollout), TestFlight, and create a GitHub Release.

## Database migrations
Migrations are automated:
- **GitHub Actions**: `.github/workflows/prisma-migrate.yml` runs `npx prisma migrate deploy` on push to main.
- **Render**: `render.yaml` includes `preDeployCommand: npx prisma migrate deploy`.

## Schema consistency check
CI runs:
```bash
npx prisma migrate diff --from-schema-datamodel ./prisma/schema.prisma --to-migrations ./prisma/migrations --exit-code
```
This ensures that every schema change has a matching migration. If not, the workflow fails.

## Codecov badge
The GitHub workflow now uploads coverage reports to Codecov automatically.
The README badge is refreshed after each push to main.

## Coverage Quality Gate
The CI enforces a minimum coverage threshold (currently 80%).
If coverage drops below this, the Codecov step will fail and block the merge.

## Security Scan Gate
A GitHub workflow (`security-scan.yml`) runs `npm audit --audit-level=high` on each push/PR.
The CI fails if any high or critical severity vulnerabilities are detected.

## License Scan Gate
A GitHub workflow (`license-scan.yml`) runs `license-checker` on dependencies.
The CI fails if any disallowed license is detected (GPL, AGPL, LGPL).
Allowed licenses include MIT, Apache-2.0, BSD, ISC, and similar permissive licenses.

## Container Scan Gate
A GitHub workflow (`container-scan.yml`) runs Trivy against the built Docker image.
The CI fails if any HIGH or CRITICAL vulnerabilities are detected in the image layers.

## Secrets Scan Gate
A GitHub workflow (`secrets-scan.yml`) uses Gitleaks to detect hardcoded secrets (API keys, passwords, tokens).
The CI fails if any secret is detected in the repository.

## Dependency Update Gate
A GitHub workflow (`dep-update-scan.yml`) runs `npm outdated` weekly and on demand.
- **Warn mode**: Lists outdated dependencies without failing CI.
- Later can be switched to **strict mode** to fail if packages are >2 major versions behind.
## Dependency Update Gate (Hybrid)
- Workflow `dep-update-scan.yml` runs a hybrid check:
  - **Fail** if any dependency is **≥2 MAJOR** verzija iza.
  - **Warn** za Δ=1 major, minor i patch.
- Script: `tools/hybrid-dep-check.mjs` (možeš mijenjati prag po želji).

## Performance Gate (Hybrid)
- Workflow `perf-gate.yml`:
  - Radi **tjedno** (schedule), **ručno** (workflow_dispatch), i na PR s labelom **perf**.
  - Pokreće k6 i provjerava **p95 <= 1500ms** preko `tools/perf-gate.mjs`.
  - Prag promijeni u workflowu ili u komandi.

## Optional AI PR Review
- Workflow `ai-pr-review.yml` radi **samo** ako je postavljen `OPENAI_API_KEY`.
- Skripta `tools/ai-pr-review.mjs` je scaffold za LLM review PR-a (dodaj pravi LLM poziv po želji).

## Prometheus Rules & Alerts
- Dodan `prometheus/rules.yml` i mount u `docker-compose.yml`.
- Alerti: **HighErrorRate**, **HighLatencyP95** (možeš ih proširiti po potrebi).
## Healthchecks
- Prometheus, Grafana i Alertmanager imaju healthcheck u `docker-compose.yml`.
- To ubrzava ponovna pokretanja i smanjuje "flaky" start sekvence.

## Mutation Testing (aktivno)
- `backend/stryker.conf.json` postavlja prag **break=60** (CI fail ispod 60% mutation score).
- Pokretanje lokalno: `npm run mutation:test --workspace=backend`.

## AI PR Review (aktivno uz secret)
- Workflow će zvati OpenAI **samo** ako je postavljen `OPENAI_API_KEY` (+ opcionalno `OPENAI_MODEL`).
- Recenzija je sažeta i fokusirana na: rizike, bugove, sigurnost, testove i performanse.

## SLO / Error Budget Burn
- SLO dashboard ima panel *Error Budget Burn (5m/1h)* (SLO=99.9% = 0.001 budget).
## Healthchecks
- Docker compose ima healthchecke za Postgres, Redis, Prometheus i Grafana radi stabilnijeg starta i boljeg ovisničkog reda.
- `redis-init` čeka da Redis bude **healthy** prije FT operacija.

## Mutation Testing (Stryker)
- U `backend/` dodani devDependencies **@stryker-mutator/core** i **@stryker-mutator/vitest-runner** (ili jest-runner).
- Konfiguracija: `backend/stryker.conf.json` s pragovima (high 80 / low 60 / break 60).
- Workflow `mutation-testing.yml` pokreće Stryker **noću** ili **ručno** i respektira threshold (`break`).

## Error Budget Burn
- SLO dashboard dobio panel *Error Budget Burn (fast/slow)* za 5m i 1h prozore (SLO 99.9%).
## Burn-rate Alerts
- Prometheus `rules.yml` ima **ErrorBudgetBurnFast** (5m >2x) i **ErrorBudgetBurnSlow** (1h >1x) pravila za SLO=99.9%.
- Dodan i `BackendDown` alert ako Prometheus ne može scrapeati backend `/metrics`.

## Mutation Testing on PR (hybrid)
- `mutation-testing.yml` sada se pokreće na PR‑ovima **samo** ako PR ima labelu `mutation` (inače: nightly/manual).

## AI PR Review (real call)
- `tools/ai-pr-review.mjs` sada stvarno zove OpenAI Chat Completions (`gpt-4o-mini`) **ako** je postavljen `OPENAI_API_KEY`.
- Bez secreta se uredno preskače (no‑op).

## Healthchecks for Prometheus & Grafana
- `docker-compose.yml` ima healthchecke i za Prometheus i za Grafana.
## Exporters & Probes
- Compose sada uključuje **redis-exporter**, **postgres-exporter** i **blackbox-exporter**.
- Prometheus scrape konfiguracije dodane su u `prometheus/prometheus.yml`.
- Alerti: **BlackboxProbeFail**, **RedisExporterDown**, **PostgresExporterDown**.

## Automated Maintenance
- **Dependabot**: `.github/dependabot.yml` (Actions + backend npm) — tjedni PR-ovi.
- **CodeQL**: statička analiza JS/TS (`codeql.yml`).
- **Dockerfile lint**: `dockerfile-lint.yml` s **hadolint**.
- **OpenAPI lint** (ako postoji `backend/openapi/`): `openapi-lint.yml` s **spectral**.
## Dev Ergonomics
- `.nvmrc` pinna Node **v20** (koristi `nvm use`).
- `.editorconfig` standardizira osnovne code-style postavke.
- **Husky pre-push**: pokreće unit testove (ako postoje) i `make smoke-ci` prije push-a.
- Makefile: `make prepush` radi isto ručno.

## CI Hygiene
- **yamllint** workflow validira sve YAML datoteke u repo-u (ne samo GitHub Actions).

## Email alerting (Alertmanager → Gmail)
- Fill `.env.alert` using `.env.alert.example`. For Gmail, create an **App Password** and set `ALERT_SMTP_PASS`.
- `docker-compose` mounts `observability/alertmanager.yml` and passes env vars (`--config.expand-env`).
- Default receivers send alerts to **soulsyncfrequency@gmail.com** (critical & warnings).
- Test: trigger a dummy alert or temporarily set low thresholds; then open Alertmanager UI.

## Docker image (backend)
- Build locally: `docker build -t soulsync-backend:ci .`
- Run with compose example: `docker compose -f docker-compose.backend.example.yml up -d`
- CI container scan now builds the local image and scans it with **Trivy**.

## GHCR image (optional)
- When you push a tag like `v1.0.0`, GitHub Actions builds & pushes `ghcr.io/soulsyncfrequency/soulsyncapp-backend:latest` and `:{} SHA`.
- You can run it via:
  ```bash
  docker run --rm -p 3000:3000 ghcr.io/soulsyncfrequency/soulsyncapp-backend:latest
  ```


## Slack notifications (CI)
- Set secret `SLACK_WEBHOOK_URL` in GitHub repo.
- CI workflows (Test Coverage, Lint, Build) send status to Slack.
- If secret not set, workflow is a no-op.

## PR title convention
- PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/).
  Examples: `feat: add therapy endpoint`, `fix: redis connection bug`.

## One-command local stack
- `docker compose -f docker-compose.full.yml up -d`
- Services: Postgres, Redis, Backend, Prometheus, Grafana, Alertmanager, exporters.
- Alert emails use `.env.alert` (copy `.env.alert.example`).

## Full stack helpers
- `make up-full` / `make down-full`
- `make logs-backend` (logs of the running backend image)

## Release process
- Use **Conventional Commits** in PR naslovima (semantic PR check je uključen).
- Merge u `main` → **release-please** generira/priprema CHANGELOG i verziju.
- Tag `v*` → **Docker Publish** push-a image u GHCR.

## Dependency management
- Repo koristi **Dependabot weekly** (npm backend + GH Actions).
- Po želji možeš preći na **Renovate** za naprednije rule-setove i batchanje PR-ova.

## Grafana dashboards
- JSON files in `observability/grafana/` can be imported via Grafana UI.
- Dashboards available:
  - API Latency & Error Budget
  - System Health (backend/redis/postgres)
  - Perf Gate Overview (k6 scenarios)
- Use "Import" → upload JSON or copy path.

## Alertmanager tuning
- `group_wait: 30s`, `group_interval: 5m`, `repeat_interval: 3h` added to reduce alert spam.

## Grafana provisioning
- Grafana je sada automatski konfigurirana:
  - **Prometheus datasource** (`http://prometheus:9090`) dodan preko `datasources.yml`.
  - **Dashboards** se autoloadaju iz `observability/grafana/dashboards-json`.
- Postojeći dashboard JSON-i (api_latency, system_health, perf_gate) možeš kopirati u tu mapu za auto-load.
- Napomena: Ako želiš da Grafana izbacuje i vlastite metrike, pokreni je s env var-om `GF_METRICS_ENABLED=true`.


## Grafana alert rules provisioning
- Default alerts (latency, error rate, container down) i resursni (CPU/Mem/Disk) dodani u `observability/grafana/provisioning/alerting.yml`.
- Prikazuju se automatski u Grafani (Alerting).

## CI cache
- `actions/cache` za `~/.npm` u CI i Coverage radi ubrzanja buildova.
- Cache se invalidira promjenom `package-lock.json`.

## Multi-Node CI
- CI i Coverage se vrte na Node **18/20/22** (matrix) za kompatibilnost kroz LTS verzije.

## Node Exporter
- `docker-compose.full.yml` sada podiže i **node-exporter** (port 9100).
- Prometheus ga skrejpa preko `node-exporter:9100`.
- Resource alerti (CPU/Mem/Disk) ovise o node_exporter metrikama.

## Slack routing (Alertmanager)
- Warning ide na `${SLACK_CHANNEL_WARN:-#alerts}`, Critical na `${SLACK_CHANNEL_CRIT:-#alerts-critical}`.
- Možeš postaviti i poseban webhook za kritične: `SLACK_WEBHOOK_CRITICAL_URL` (inače koristi `SLACK_WEBHOOK_URL`).

## SLO panel
- Dashboard **API Latency & Error Budget** ima panel **SLO % under 1.5s (5m)**.
- Izraz mjeri udio zahtjeva ispod 1.5s u zadnjih 5 minuta.
