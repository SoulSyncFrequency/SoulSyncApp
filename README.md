[![CI](https://github.com/SoulSyncFrequency/SoulSyncApp/actions/workflows/ci.yml/badge.svg)](https://github.com/SoulSyncFrequency/SoulSyncApp/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/SoulSyncFrequency/SoulSync-Fullstack/branch/main/graph/badge.svg)](https://codecov.io/gh/SoulSyncFrequency/SoulSync-Fullstack)

# 🌐 SoulSync App

[![codecov](https://codecov.io/gh/SoulSyncFrequency/SoulSyncApp/branch/main/graph/badge.svg)](https://codecov.io/gh/SoulSyncFrequency/SoulSyncApp)
![build](https://img.shields.io/github/actions/workflow/status/SoulSyncFrequency/SoulSyncApp/ci.yml?branch=main)

Fullstack SoulSync aplikacija: terapijski engine, personalizirana prehrana i suplementi, PDF export, CI/CD pipeline i mobilna podrška (Capacitor).

---

## ✨ Glavne značajke
- 🔐 **Auth sistem** (JWT login/register, SQLite by default, opcionalno Postgres).
- 🧠 **Ultra51c terapijski engine** – frequency + molecule terapija, EMDR, psilocybin, DNA reprogramming, Metabolic Awakening.
- 🧬 **SMILES generator** – stvarni molekularni stringovi.
- 📄 **PDF export** – 5-dnevni plan (nutricija + chakre + terapijski moduli).
- 🌗 **Dark/Light mode** + sticky footer.
- 📊 **Testovi & CI/CD**:
  - Backend (Jest, SQLite + Postgres service).
  - Frontend (Vitest, Cypress e2e).
  - Coverage report (Codecov).
  - Docker build & push (ghcr.io).
- 📦 **Capacitor** – spreman za build na Android/iOS.

---

## 🚀 Pokretanje lokalno

### Backend
```bash
cd backend
cp .env.example .env
# Postavi JWT_SECRET
npm i
npm run dev
# http://localhost:5000/api/health
```

### Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:5000
npm i
npm run dev
# http://localhost:5173
```

---

## 🧪 Testiranje

### Backend (Jest)
```bash
cd backend
npm run build
npm test -- --coverage
```

### Frontend (Vitest)
```bash
cd frontend
npm run test -- --coverage
```

### Cypress (mocked API)
```bash
cd frontend
npm run dev &
npx cypress open
```

### Cypress (real backend)
```bash
cd backend && npm run dev &
cd frontend && VITE_API_BASE_URL=http://localhost:5000 npm run dev &
npx cypress run --spec cypress/e2e/real_flow.cy.ts
```

---

## ☁️ Deploy

### Render (backend)
- `render.yaml` je spreman.
- Env vars:  
  - `PORT=5000`  
  - `JWT_SECRET=<secret>`  
  - `PG_CONNECTION_STRING=<postgres-url>` (opcionalno)

### Frontend (prod build)
```bash
cd frontend
echo "VITE_API_BASE_URL=https://api.soulsync.app" > .env.production
npm run build
npx cap copy
```

---

## 📱 Play/App Store checklist
Detaljni koraci → [STORE-CHECKLIST.md](./STORE-CHECKLIST.md)

---

## 📜 Licenca
Projekt je objavljen pod [MIT licencom](./LICENSE).  
© 2025 SoulSyncFrequency

## 📦 Analiza bundla (frontend)

Za provjeru veličine i strukture frontenda koristi se **rollup-plugin-visualizer**.

### Kako pokrenuti
```bash
cd frontend
npm run build
```

Nakon builda generira se fajl:
```
frontend/dist/stats.html
```

### Pregled
- Otvori `stats.html` u browseru.  
- Dobit ćeš grafički prikaz svih paketa u bundlu (React, tvoje komponente, third-party libraryji).  
- To pomaže da vidiš što zauzima najviše prostora i gdje se može optimizirati.


## Self-heal & Health Endpoints
- Backend exposes `GET /api/health`, `/api/livez`, `/api/readyz`.
- A lightweight self-heal agent boots on server start to ensure SQLite is initialized and old reports are cleaned.

## Bundle analysis
- To generate a bundle report locally: `cd frontend && ANALYZE=1 npm run build` then open `frontend/stats.html`.


## Observability (Sentry — optional)
- Backend: set `SENTRY_DSN` to enable tracing & error capture.
- Frontend: set `VITE_SENTRY_DSN` to capture UI errors and perf.
- Bez DSN-a, Sentry je inertan.

## Feature flags
- Postavi `FEATURE_FLAGS=flag1,flag2` u backend okruženju.
- `GET /api/flags` vraća aktivne flagove; frontend helper `fetchFlags()`.

## docker-compose (čisto)
- Healthcheck i restart su integrirani unutar `backend` servisa.
- `frontend` ovisi o `backend` i koristi `VITE_API_URL`.


## Production frontend (nginx)
- `frontend/Dockerfile` builda React app i servira preko nginx-a na portu 80 (exponiran kao 8080 u docker-compose).
- Reverse proxy `/api/*` ide na backend:5000.

## Sentry sourcemaps
- CI job `sentry-release` builda s `--sourcemap` i uploada u Sentry (potrebno postaviti `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`).


## Security & Validation
- **Rate limiting**: `/api/auth/*` (20 req / 15 min), `/api/generateTherapy` (10 req / 5 min).
- **Input validation**: all therapy requests validated with Zod schema.

## Observability (Metrics)
- `GET /api/metrics` → Prometheus metrics endpoint.
- Includes default system metrics + http_request_duration_seconds histogram.


## Drizzle ORM & migrations (PG)
- Schema: `backend/drizzle/schema.ts`
- Migracije (SQL): `backend/migrations/*.sql`
- Runner: `npm -w backend run migrate:pg` (treba `PG_CONNECTION_STRING` ili `DATABASE_URL`)
- SQLite dev/test i dalje radi bez migracija; PG prod koristi migracije.


## OpenAPI (Swagger)
- Spec: `backend/openapi.yaml`
- UI: `/api/docs` (Swagger UI), JSON: `/api/openapi.json`

## Pact (Contract tests)
- Consumer (frontend): `npm -w frontend run pact:consumer` → generira `frontend/pacts/*.json`
- Provider (backend): `npm -w backend run pact:provider` (pokreni backend pa verifikacija paktova)
- CI job `pact-contracts` pokreće cijeli flow.

## Auto-rollback (CI primjer)
- Job `deploy-and-verify` radi health gate, rollback na fail (šablona; zamijeni deploy komandama za tvoj target).

## Kubernetes (Kustomize)
- Manifesti u `k8s/base`, `k8s/overlays/prod`.
- Deploy primjer:
  ```bash
  kubectl apply -k k8s/overlays/prod
  ```


## OpenAPI TypeScript client (frontend)
- Generiraj SDK: `npm -w frontend run sdk:generate`
- Kôd ide u `frontend/src/sdk`. SDK koristi `fetch`; postavi `VITE_API_URL` i (ako treba) presretni `request` za auth header.


## Helm Chart
- Putanja: `helm/soulsync`
- Instalacija:
  ```bash
  helm upgrade --install soulsync ./helm/soulsync     --set image.backend.repository=ghcr.io/YOUR/soulsync-backend     --set image.frontend.repository=ghcr.io/YOUR/soulsync-frontend     --set ingress.host=soulsync.local
  ```


## React Query hooks
- `src/hooks/api.ts` sadrži `useMe`, `useLogin`, `useGenerateTherapy` hookove.
- U `main.tsx` je dodan `QueryClientProvider`.

## Publish workflow
- Tagiraj repo npr. `v1.0.0` → workflow **Publish** gradi i push-a **GHCR** slike (backend+frontend) i uploada **Helm chart** kao artifact.


## GitHub Releases
- Workflow **Publish** također kreira GitHub Release kad se push-a tag (`vX.Y.Z`).
- Release uključuje:
  - Docker image tagove na GHCR (`soulsync-backend`, `soulsync-frontend`).
  - Helm chart `.tgz` kao asset.


## Release notes (auto)
- Koristi se **release-drafter** za automatsko generiranje release notes-a iz PR-ova i commit poruka.
- Konfiguracija: `.github/release-drafter.yml`
- Workflow **generate-release-notes** update-a draft release pri svakom push-u na main.
