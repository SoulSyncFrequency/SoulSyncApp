# SoulSync App Coding Playbook

A practical, battle-tested guide for building, testing, releasing and operating SoulSync.

## Architecture
- **Monorepo** with npm workspaces: `frontend` (React/Vite/TS), `backend` (Express/TS), `mobile` (Capacitor), `packages/sdk-rest` (OpenAPI).
- **Source of truth** for API: `backend/openapi.yaml` → SDK auto-generation in CI.
- **Separation**: Frontend is pure web (no Capacitor deps), native parts live under `mobile/`.

## Frontend (React + Vite + TS)
- **Quality**: strict TS + `noUncheckedIndexedAccess`; ESLint+Prettier; ErrorBoundary; Sentry (release via `VITE_RELEASE`).
- **Performance**: route-based code splitting, prefetch critical data, cache via React Query.
- **Security**: CSP and secure headers via NGINX (`nginx.conf`).
- **DX**: vite sourcemaps; size budget with `size-limit` in CI.

## Backend (Express + TS)
- **Observability**: `/healthz`, `/readiness`, `/metrics` (Bearer guard), Sentry, **pino** structured logs.
- **Security**: CORS allowlist, security headers, granular rate limits (`auth`, `billing`, `general`).
- **Correctness**: Zod validation for **env**, **responses** (strict in dev/test), optional request validation; graceful shutdown.
- **API**: OpenAPI-first → SDK + Spectral lint.

## Mobile (Capacitor)
- Single canonical `capacitor.config.ts` in `mobile/`; native permissions declared + runtime via plugins; icons/splash for stores.

## Testing
- **Unit/Integration**: on both front/back.
- **E2E (device)**: Maestro stub `e2e/happy-path.test.yml` (login → questionnaire → PDF).
- **Coverage**: uploaded to Codecov; enforce threshold on `main`.

## CI/CD
- **semantic-release** (on `main`) → version + CHANGELOG + GitHub Release.
- **Tag `v*` → all-in-one**: build front/back; upload sourcemaps; generate/publish SDK; deploy via Render hooks.
- **Quality gates**: lint, typecheck, test, coverage, CodeQL, size-limit.
- **Automation**: Dependabot (weekly), Spectral OpenAPI lint.

## Ops
- **Render** deployment with health checks; distroless backend, static frontend on NGINX.
- **SLOs**: 99.9% uptime, <1% error rate, p95 < 500ms; alerts in `ops/alerts.yml`.
- **Runbook**: see `docs/RUNBOOK.md`.
- **Incident response**: see `docs/INCIDENT_RESPONSE.md`.

