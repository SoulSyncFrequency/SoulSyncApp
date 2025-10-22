![Build](https://img.shields.io/github/actions/workflow/status/SoulSyncFrequency/SoulSyncApp/security-suite.yml?label=security%20suite) ![SBOM](https://img.shields.io/badge/SBOM-CycloneDX-blue) ![Release](https://img.shields.io/github/actions/workflow/status/SoulSyncFrequency/SoulSyncApp/release-please.yml?label=release)

[![GitHub stars](https://img.shields.io/github/stars/SoulSyncFrequency/SoulSyncApp?style=social)](https://github.com/SoulSyncFrequency/SoulSyncApp/stargazers)
[![License](https://img.shields.io/github/license/SoulSyncFrequency/SoulSyncApp)](./LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/SoulSyncFrequency/SoulSyncApp?logo=github)](https://github.com/SoulSyncFrequency/SoulSyncApp/releases)
[![CI](https://github.com/SoulSyncFrequency/SoulSyncApp/actions/workflows/ci.yml/badge.svg)](https://github.com/SoulSyncFrequency/SoulSyncApp/actions/workflows/ci.yml)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen?logo=renovatebot)](https://docs.renovatebot.com/)
[![codecov](https://codecov.io/gh/SoulSyncFrequency/SoulSyncApp/branch/main/graph/badge.svg)](https://codecov.io/gh/SoulSyncFrequency/SoulSyncApp)

# SoulSync — Full App (Web + Admin + API + Mobile wrapper)

This repo contains:
- **frontend/** — React web app (user & Admin Editor)
- **backend/** — Node/Express API
- **mobile/** — Capacitor wrapper for iOS/Android (loads built frontend)
- **.github/workflows/** — CI for lint/typecheck/build/test + Codecov
- **render.yaml** — one-click deploy to Render.com
- **docker-compose.yml** — local dev with hot reload
- **.env.example** — sample env vars

## Quick Start (local)

```bash
# backend
cd backend
cp ../.env.example .env   # adjust ADMIN_TOKEN etc.
npm i
npm run dev

# frontend
cd ../frontend
npm i
npm run dev
```

Open http://localhost:5173 and visit `/admineditor` (token: from .env `ADMIN_TOKEN`, default `dev-token`).

## Build & Run with Docker

```bash
docker-compose up --build
```

## Deploy to Render

- Push to GitHub, connect repo in Render.
- Render reads `render.yaml` to create a **Web Service** (backend) and a **Static Site** (frontend).

## Codecov

- Create a Codecov project, add `CODECOV_TOKEN` as a GitHub secret.
- CI uploads coverage using `codecov/codecov-action`.

## Mobile (Capacitor wrapper)

- `npm i` in `mobile/`
- `npm run build:web` (builds frontend into `frontend/dist`)
- `npx cap sync`
- Open iOS/Android projects via Xcode/Android Studio, adjust app id, icons, and signing.
- The wrapper serves built web (`frontend/dist/`).

## Notes
- Choose a license (MIT/Apache-2.0/etc.) — see `LICENSE-CHOOSE.md`.
- Adjust branding, icons, and store metadata for App Store & Google Play.

---

## Store Pipeline (Fastlane Templates)
- Templates located in `fastlane_templates/` (Android & iOS)
- Adjust `Appfile` and `Fastfile` for your bundle ids and lanes.
- Icons at `public/store-assets/`. Replace with final branding.

## E2E & Unit Tests (optional)
- Example Playwright config `playwright.config.ts`
- Tests under `frontend/tests`, `backend/src/__tests__`, and `tests/`
- Enable in CI by adding proper `test` scripts in package.json files.

## Mobile Projects
- Capacitor project is in `mobile/`. Legacy `ios/` and `android/` from older zips were copied into `mobile/` for reference.
- Recommended: generate fresh platforms via:
  ```bash
  cd mobile
  npm i
  npm run sync   # builds web + cap sync (creates ios/android if missing)
  npm run ios    # open Xcode
  npm run android
  ```

## Releasing

- Trigger the `Release` GitHub Action (manually or on push to main)
- It will:
  1. bump patch version in `VERSION.md`
  2. create a git tag
  3. push the tag
  4. create a GitHub Release with the latest `CHANGELOG.md`

- `scripts/bump-version.js` bumps the patch version locally

## 📦 Deployment

**Environment variables required:**  
- `ADMIN_TOKEN` — secret key for admin routes  
- `VITE_API_BASE` — base URL for backend API (for frontend build)  

**Build steps:**
```bash
# frontend
cd frontend
npm ci
npm run build

# backend
cd ../backend
npm ci
npm run build
```

**Preflight check before deploy:**
```bash
node scripts/preflight.js
```

**Deploy:**
- Push `main` branch → triggers CI → creates tagged release on GitHub
- Upload build to Render / App Store / Google Play as needed
```

## 💰 Monetizacija (Paywall skeleton)

- `PaywallGate` komponenta štiti premium dijelove aplikacije
- `billingState.ts` čuva `ownedProducts` i `isPro`
- `Paywall.tsx` omogućuje "kupnju" (demo, bez stvarne naplate)

🔑 Kad korisnik kupi barem jednu opciju, otključavaju se sve značajke u ovoj ranoj fazi.
Kasnije će se naplaćivati pojedinačno (5€/8€/10€).

### Buduća integracija
- App Store: StoreKit IAP
- Google Play: Billing Library
- Web: Stripe Checkout
- Backend rute: `/api/billing/verify`, `/api/billing/webhook`

## Features & Paywall

- **direct** — brzi direktni unos (trenutno besplatan)
- **questionnaire** — veliki upitnik → terapija (premium, zaštićen PaywallGate)
- **verifier** — admin/verifier alati i napredne provjere (premium, zaštićen PaywallGate)

*Early-supporter logika:* kupnja **barem jedne** opcije privremeno otključava **sve**.

## Verifier modes
- Normalni korisnici vide `UserVerifier` (analiza, bez uređivanja podataka)
- Ako u konzoli postavite `localStorage.admin = "true"`, otvara se `AdminEditor` s uređivanjem i backupom
- `ADMIN_TOKEN` potreban je samo na `/api/verifier/admin` rutama

## Opcije
- **Direct input** 🟢 — besplatan
- **Questionnaire** 💎 — premium
- **Verifier** 💎 — premium

Ako korisnik kupi barem jednu opciju dok aplikacija nije zaključana, privremeno se otključavaju sve.

## 🔔 Notifikacije
- Frontend: `Settings → Notifikacije` za dozvolu i test obavijest
- Backend: `/api/notify` stub (povezati s FCM/APNs kasnije)

## 💳 IAP skeleton
- `src/state/iap.ts` — purchase/restore stub (Play Billing / StoreKit kasnije)
- Povezan s `Paywall` i `billingState`

## 📱 Mobilni build (Capacitor)
- `mobile/capacitor.config.ts`
- Generiraj platforme lokalno: `npx cap add ios && npx cap add android`
- Platform projekti se ne verzioniraju (best practice)

## 🧩 PWA
- `public/manifest.json` i `service-worker.js`
- Registracija SW u `main.tsx`

## 🛍️ Store assets & Fastlane
- `store-assets/` placeholder ikone/splash
- `fastlane/` skeleton

## 🔐 App Links
- `public/.well-known/assetlinks.json` i `apple-app-site-association`

## Database storage for push tokens
- Set `DATABASE_URL` (Postgres). If present, tokens go to DB; otherwise JSON fallback.

## APNs production sending
- Provide `APNS_AUTH_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`.


## Imported (MASTER_ALL) summary

- package.json merged at: backend/package.json
- scripts imported: 4
- frontend env keys added to `frontend/.env.example`: 0
- vite configs imported: True
- dashboard files imported: 2
- workflows imported (stored under `.github/workflows/imported/`): 1
- store assets imported: 9

> Napomena: sve uvezene datoteke nalaze se pod `*/imported/*` putanjama kako ne bi dirale postojeći build dok ih ne uključiš ručno.


## Polish & Hardening (v80.3.1)
- Editor & formatting: `.editorconfig`, `.prettierrc`, `.prettierignore`
- ESLint base config for root, backend, frontend
- Husky pre-commit runs format/lint (non-blocking if not present)
- Backend hardening: CORS (env `ALLOW_ORIGIN`), trust proxy, disable `x-powered-by`, JSON body limits, 404 & error handler
- Backend types augmentation (`reqId`, `user`)
- CI: added concurrency to auto-cancel outdated runs


## Smart additions (v80.3.2)
- `/metrics` (Prometheus exposition) + global request counter
- Request validation middleware (`zod`) i primjer na billing checkout ruti
- `helmet.contentSecurityPolicy` (CSP) s default direktivama
- Frontend `LegalRenderer` koji automatski učitava sve `legal/imported/**/*.{md,txt}`
- `ImportedDashboards` wrapper za pregled uvezenih dashboard komponenti (router hook-in po potrebi)


## Visual & Routes (v80.3.3)
- Dodane rute `/legal` i `/dashboards/imported` + linkovi u navigaciji
- Aktivirane nove splash/icon slike iz `StoreReady_plus25` (stare premještene u `resources/original/`)


## Healthcheck (v80.3.4)
- Dodan backend endpoint `GET /healthz`
- CI job `health-check` provjerava da server radi nakon builda


## Self-versioned (v80.3.5)
- Dodan backend endpoint `GET /version` (name, version, commit, timestamp)
- CI job `version-check` uspoređuje git tag, package.json i backend /version


## Commit-aware (v80.3.6)
- CI automatski postavlja `GIT_COMMIT` i `BUILD_TIME` u env
- Backend `/version` sada vraća i commit + buildTime


## Diagnostics (v80.3.7)
- Backend: dodan `GET /admin/diagnostics` (status, uptime, version, commit, buildTime, memory)
- Frontend: `VersionBadge` komponenta u footeru, vidljiva samo ADMIN korisnicima


## Admin Panel (v80.3.8)
- Dodana frontend stranica `/admin/diagnostics` (vidljiva samo ADMIN korisnicima)
- Prikazuje status, uptime, memory, platform, version, commit, buildTime


## Admin Panel Extended (v80.3.9)
- Backend: dodan `POST /admin/restart` koji restartuje server (process.exit)
- Frontend: Diagnostics panel dobio gumb "Restart Server" i real-time grafove (requests, heap, uptime)


## Self-healing (v80.4.0)
- Backend: dodani `/admin/backup` i `/admin/restore` (sigurnosne kopije i vraćanje)
- Backend: dodani `/admin/logs` i `/admin/logs/analyze` (AI analiza logova)
- Frontend: gumbi za backup/restore i audit log u Diagnostics panelu


## Watchdog (v80.4.1)
- Backend: watchdog koji svakih 5 min provjerava healthz/metrics
- Ako heap > 1.5GB, uptime < 60s ili healthz ne radi → backup + restart
- Logira akcije u logs/watchdog.log


## Notifications (v80.4.2)
- Watchdog sada šalje Discord notifikacije kad pokrene backup+restart
- Postavi `DISCORD_WEBHOOK_URL` u `.env` da bi radio


## Daily Report (v80.4.3)
- Watchdog sada 1x dnevno šalje Discord health report
- Sadrži: version, commit, uptime, heap, rss, requests, restarts


## Admin Dashboard (v80.5.0)
- Dodan potpuno novi web-based admin panel na `/admin`
- Sadrži sidebar i sekcije: Status, Metrics, Backup, Server Controls, Logs, Reports
- Vidljiv samo ADMIN korisnicima


## Admin Dashboard Full (v80.5.1)
- Svi moduli iz Diagnostics premješteni u /admin dashboard
- Status, Metrics, Backup, Server Controls, Audit Logs, Reports sada rade potpuno


## Admin Auth (v80.5.2)
- Dodana prava autentifikacija za /admin panel
- .env: ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET
- Login forma i JWT token (httpOnly cookie) za zaštitu panela


## Admin Logout (v80.5.3)
- Dodan /admin/logout endpoint
- AdminDashboard sada ima logout gumb (briše cookie i localStorage.admin)


## Enterprise Guardrails (v80.6.0)
- RBAC middleware (`requireRole`) i role: ADMIN/THERAPIST/USER
- Audit trail middleware (logs/audit.log) + `/admin/audit`
- Admin 2FA (TOTP) podrška kroz `ADMIN_TOTP_SECRET` i `/admin/2fa/setup`
- BullMQ skeleton (Redis) + `/admin/simulate` queue za sandbox
- Protocol versioning (file-based) + activate/rollback
- Encrypted patient audit (AES-GCM) s agregatima
- Admin UI: Simulation, Protocols, Patient Audit sekcije
- Sve dodano **na način da build ne puca** ako opcionalne ovisnosti nisu instalirane


### Prisma
- Pokreni `npx prisma generate && npx prisma migrate dev` ako želiš DB backend za audit/protocols.

## v80.8.0 ENTERPRISE db-analytics
- Sentry user context: automatski šalje user.id i role u error evente (ako je DSN postavljen)
- Prisma DB dual-write za audit i protocols (ako postoji Prisma)
- Fallback ostaje file-based ako DB nije aktivan


## v80.8.1 ENTERPRISE db-adminui
- /admin/audit endpoint: filter (`?q=`) i limit (`?limit=`); DB upiti ako postoji Prisma
- Admin UI: AuditLogs dobio pretragu, limit i oznaku "DB-backed if Prisma active"
- Protocols UI: prikazuje izvor podataka (DB vs file)


## v80.9.0 ENTERPRISE observability-complete
- Frontend Sentry user context: automatski šalje user.id i role ako su dostupni
- CSV export u Audit Logs i Protocols
- Grafana starter dashboard: `grafana-provisioning/dashboards/soulsync.json`


## v81.0.0 ENTERPRISE users-core
- Prisma model: User, Session (enum Role: ADMIN/THERAPIST/USER)
- /auth/login, /auth/logout, /auth/me (session cookie workflow)
- Middleware requireAuth (DB-backed sessions)
- Admin routes: list/add/change-role/toggle/reset-password
- Admin UI: /admin → Users sekcija za upravljanje korisnicima
- Napomena: pokreni `npx prisma migrate dev` da bi DB bio aktivan


## v81.5.0 ENTERPRISE users-complete
- Unified auth: prefer `/auth/login` (DB sessions). `/admin/login` sada vraća 426 (use /auth/login).
- Email reset/magic-link: SMTP env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Fallback: preview u response.
- 2FA (TOTP) za ADMIN/THERAPIST: `/auth/2fa/setup` + `/auth/2fa/verify` (speakeasy + qrcode).
- Magic-link login za USER: `/auth/magic` + `/auth/magic/:token`.
- Admin UI: gumb **Enable 2FA** uz svakog korisnika.
- Tests: `backend/tests/auth.test.ts` (skeleton za jest + supertest).


## v82.0.0 ENTERPRISE users-hardening
- /admin guard sada koristi `/auth/me` + session cookie (više nema `localStorage.admin`)
- Invite user flow: `POST /admin/users/invite {email, role}` (šalje magic-link)
- Rate limiting za sve `/auth/*` rute (ENV: RATE_WINDOW_MS, RATE_LIMIT)
- Password policy + reset via email link (`/auth/password/request` + `/auth/password/reset/:token`)
- Jest setup (backend) + CI workflow `test.yml`


## v82.5.0 ENTERPRISE admin-tools
- Admin UI: Invites tab (pregled + resend + copy link)
- Admin UI: Rate Limits tab (trenutni limiter brojači)
- Users tab: Send Reset Link po korisniku
- Admin sidebar: badge prikazuje `auth/me` korisnika


## v83.0.0 ENTERPRISE therapy-modules
- Prisma model: TherapyModule { id, name, version, description, active, createdAt, updatedAt }
- Backend: /admin/modules CRUD (list, add, toggle, update)
- Admin UI: nova tablica 'Therapy Modules' u /admin
- Priprema za povezivanje s terapijskim engine-om


## v83.5.0 ENTERPRISE module-engine-links
- TherapyModule proširen: endpoint (String), config (Json), files (Json)
- Backend: GET /admin/modules/:id i POST /admin/modules/:id/link
- Admin UI: gumb "Configure" za postavljanje endpoint/config/files
- Priprema za spajanje terapijskih modula s engineom


## v84.0.0 ENTERPRISE module-execution
- Prisma: dodan model ModuleRunLog
- Backend: POST /admin/modules/:id/run (izvršava modul), GET /admin/modules/:id/logs
- Sprema status i response svakog pokretanja
- Frontend: gumbi Run i View Logs u Therapy Modules tablici
- Omogućeno pokretanje modula (SMILES, F₀, EMDR...) direktno iz admin panela


## v84.5.0 ENTERPRISE module-custom-run
- Backend: /run endpoint sada prima `extraInput` i spaja ga s `config` prije slanja na endpoint
- Sprema `extraInput` u `ModuleRunLog.response.meta`
- Frontend: klik na Run sada pita za custom input JSON (opcionalno)
- Omogućeno privremeno pokretanje modula s prilagođenim parametrima


## v85.0.0 ENTERPRISE module-logs-ui
- Backend: /logs endpoint sada vraća i module.config
- Frontend: View Logs sada otvara modal sa tablicom svih logova (status, meta, result)
- Jasno vidljivi inputi i outputi svakog pokretanja modula


## v85.5.0 ENTERPRISE module-logs-export-filters
- Backend: /logs endpoint podržava `status` i `since` query filtere
- Backend: /logs/export endpoint vraća CSV ili JSON datoteku
- Frontend: dodani filteri (status, date) + Export CSV/JSON gumbi u Logs modalu


## v86.0.0 ENTERPRISE module-logs-analytics
- Backend: /logs/stats endpoint (grupiranje po danu, success vs failed)
- Frontend: chart (recharts) u Logs modalu, prikazuje trend uspješnosti kroz vrijeme
- Dropdown za period (7 / 30 / 90 dana) + Refresh


## v87.0.0 ENTERPRISE executor-engine
- Prisma: dodan model TherapySession (pohrana run sesija po korisniku)
- Backend: POST /executor/run — pokreće sve aktivne module s inputom korisnika i kreira TherapySession
- Frontend: Admin → "Therapy Executor" (userId + input JSON → 1-klik agregirani run)
- Dokumentacija: docs/PATENTS_MODULES_REGISTRY.md + backend/src/engine/patentsRegistry.json


## v88.0.0 ENTERPRISE executor-queue-plans
- Executor otvoren za ADMIN i THERAPIST; terapeuti smiju pokretati samo za **svoje** klijente (model `TherapistClient`)
- Queue skeleton (BullMQ/Redis): ako `REDIS_URL` postoji → job ide u queue; inače sinkrono izvršavanje (fallback)
- Standardizirano izvršavanje u `runModule()`; dijeljena logika za worker i sync
- Hook `onSessionComplete` sada kreira/aktivira `UserPlan` iz rezultata sesije; prethodni planovi se deaktiviraju
- Nova tablica `UserPlan { userId, sessionId, plan, active }`
- `TherapySession` proširen s `triggeredByRole` i dokumentiranim statusima
- Worker starter: `backend/src/queue/worker.ts` (no-op ako nema REDIS_URL)


## v88.5.0 ENTERPRISE user-plans-ui
- Backend: nove rute `/admin/user-plans` (GET) i `/admin/user-plans/:id/activate` (POST)
- Frontend: nova Admin kartica "User Plans" — tablica planova, prikaz aktivnog, ručna aktivacija


## v89.0.0 ENTERPRISE user-plans-viewer
- Admin → User Plans: klik na redak otvara modal sa sadržajem plana (`plan` JSON)
- Omogućuje pregled sadržaja plana bez baze


## v89.5.0 ENTERPRISE user-plans-delete
- Backend: dodana ruta `DELETE /admin/user-plans/:id`
- Frontend: gumb 🗑 Delete pored Activate, briše plan uz potvrdu


## v90.0.0 ENTERPRISE user-plans-search
- Admin → User Plans: dodan search bar za filtriranje po `userId` i `sessionId` (lokalno, bez API poziva)


## v90.5.0 ENTERPRISE user-plans-sort
- Admin → User Plans: klik na zaglavlje kolone (User, Session, Created) sortira tablicu uz toggle asc/desc


## v91.0.0 ENTERPRISE resilience-suite
- A) Health Automation: ModuleHealth model, auto-disable after 5 fails, /admin/health/summary, dailyCron (retention, stale cleanup, health pings)
- B) LLM Gateway: backend/src/ai/provider.ts with caching (AiCache), provider selection (openai/azure/local)
- C) Graceful degradations: admin banner if modules disabled/failing; queue & DB fallbacks remain
- D) Plan governance: UserPlan adds version + sourceSessionId; UI: Diff prev + Revert to previous; backend revert endpoint
- E) Security/compliance: AuditLog model + entries on auto-activate plan, module auto-disable; RBAC export endpoint; REQUIRE_2FA flag support (reported via /admin/rbac/export)


## v92.0.0 ENTERPRISE audit-cron-worker
- Backend: `adminAudit` rute — `/admin/audit` (filteri: event, since, limit) i `/admin/audit/export` (csv/json)
- Frontend: Admin → **Audit Log** (tablica + filteri + export), RBAC snapshot viewer
- Server entrypoint: `backend/src/index.ts` — pokreće app; opcionalno `START_WORKER=true`, `START_CRON=true`


## v92.5.0 ENTERPRISE audit-polish
- Audit Log: dodani gumbi Last 24h / 7d / 30d za brzo filtriranje po datumu
- Therapy Modules: gumb Enable pored deaktiviranih modula; piše AuditLog (MODULE_MANUAL_ENABLED)


## v93.0.0 ENTERPRISE auto-disabled-badge
- Health summary vraća i `failingModuleIds` (moduleId s `consecutiveFails >= 5`)
- Therapy Modules: prikazuje crveni badge **Auto-disabled** pored deaktiviranih modula koji su automatski isključeni zbog kvarova


## v93.6.0 ENTERPRISE reset-fail-counter
- Backend: `POST /admin/modules/:id/reset-fails` — postavlja `consecutiveFails=0`, čisti `disabledUntil`, piše `AuditLog: MODULE_FAILCOUNT_RESET`
- Frontend (Therapy Modules): uz **Auto-disabled** badge dodan gumb **Reset fail counter** koji poziva endpoint i osvježi health summary


## v94.0.0 ENTERPRISE reset-enable+polish
- Backend: `POST /admin/modules/:id/reset-and-enable` — resetira fail counter i odmah aktivira modul; AuditLog: `MODULE_RESET_AND_ENABLED`
- Frontend (Therapy Modules): gumb **Reset & Enable** pored **Auto-disabled** bedža
- Frontend (Therapy Modules): osiguran checkbox **"Show only auto-disabled"** ako prije nije bio prisutan


## v94.5.0 ENTERPRISE confirm-tooltips-autoretry
- Health summary sada vraća i `lastErrors` (zadnje 3 greške po auto-disabled modulu) → UI badge tooltip
- Admin → Therapy Modules: `Reset & Enable` sada traži potvrdu (`confirm`)
- Cron: automatski pokušaj **auto-ponovnog uključivanja** modula ako health ping prođe (piše `AuditLog: MODULE_AUTO_REENABLED`)


## v95.0.0 ENTERPRISE user-plans-badges-diff
- Admin → User Plans: dodan **Status** badge (Active vX / vX) po planu
- Admin → User Plans: **Compact Diff** (added/removed/changed keys) uz postojeći side-by-side JSON diff


## v95.5.0 ENTERPRISE diff-values-export-audit-quickpick
- Admin → User Plans: Compact Diff sada prikazuje i **stare i nove vrijednosti** za Changed (old → new)
- Admin → User Plans: gumb **Export** za skidanje `plan` JSON-a po retku
- Admin → Audit Log: **Quick events** dropdown za brzo filtriranje po najčešćim eventima


## v96.0.0 ENTERPRISE diff-highlights-copy
- User Plans → Compact Diff: vizualni indikatori (🟢 Added, 🔴 Removed, 🟡 Changed)
- User Plans → Compact Diff: copy-to-clipboard gumbi (path / old→new vrijednosti)


## v96.1.0 ENTERPRISE diff-copy-all
- User Plans → Compact Diff: dodani gumbi **Copy all changes** (kopira cijeli compact diff u clipboard) i **Download JSON** (spremi kao datoteku)


## v96.2.0 ENTERPRISE diff-options-pdf
- User Plans → Compact Diff: dodan gumb **Copy changed paths** i **Concise view** (skrati dugačke vrijednosti)
- User Plans → per plan: **Export PDF** (otvara print-friendly prozor spreman za spremanje u PDF)


## v96.3.0 ENTERPRISE diff-more-tools
- User Plans → Compact Diff: dodani gumbi **Copy added** i **Copy removed**
- User Plans → Compact Diff: **Filter path…** input za brzo filtriranje pathova (aplicira se na Added/Removed/Changed liste)


## v96.4.0 ENTERPRISE diff-expand-csv
- User Plans → Compact Diff: **Expand all / Collapse all** sekcije (Added/Removed/Changed)
- User Plans → Compact Diff: **Download CSV** (kolone `type,path,old,new`)


## v96.5.0 ENTERPRISE diff-summary
- User Plans → Compact Diff: dodan **summary bar** (broj 🟢 Added / 🔴 Removed / 🟡 Changed — dinamički po filteru)


## v97.0.0 ENTERPRISE auditlog-suite
- Audit Log: Advanced filter bar (event, actor, target, date range)
- Audit Log: Grouping by session (15-min block by actor)
- Audit Log: Diff preview modal (ako log.data.diff postoji)
- Audit Log: Export CSV (filtrirani rezultati)


## v98.0.0 ENTERPRISE user-mgmt
- Admin → Users stranica (tablica korisnika: id, email, role, createdAt, lastLogin)
- Gumbi: Promote/Demote, Deactivate, Delete, Login as user (impersonate)
- Role badge-ovi (🟢 ADMIN / 🟡 THERAPIST / ⚪ USER)
- Backend rute: GET /admin/users, POST /admin/users/:id/role, POST /:id/deactivate, DELETE /:id, POST /:id/impersonate


## v98.5.0 ENTERPRISE user-mgmt-guard-search
- Users: dodan search po emailu i filter po roli
- Backend: zaštita — ne možeš degradirati/deaktivirati/obrisati jedinog ADMIN-a


## SDK generation
- `npm -w backend run openapi:check`
- `npm -w packages/sdk-rest run gen`

## Sentry sourcemaps
Sourcemaps se uploadaju iz CI-a koristeći `getsentry/action-upload-sourcemaps` i `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

## Unified Release (tag-driven)
Push a tag like `v101.5.35` to trigger:
- Frontend build (with `VITE_RELEASE`)
- Sentry sourcemaps upload (if SENTRY_* secrets set)
- Backend build (with `RELEASE_VERSION`)
- SDK generation & (optional) publish to GitHub Packages
- Optional Render deploy via deploy hooks

### Required secrets (optional ones may be empty)
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `GITHUB_PACKAGES_TOKEN` (scope `write:packages`)
- `RENDER_FRONTEND_DEPLOY_HOOK`, `RENDER_BACKEND_DEPLOY_HOOK`


## Config & ENV
- Pogledaj `CONFIG_VALIDATION.md` i `ENV_MATRIX.md`
- Primjeri varijabli u `ops/.env.backend.example` i `ops/.env.frontend.example`

![OpenAPI Diff](https://img.shields.io/badge/OpenAPI-diff-green)

## Operations & Security
- See [OPERATIONS.md](OPERATIONS.md)
- Security policy: [SECURITY.md](SECURITY.md)


---

CI: ![Final Matrix](https://img.shields.io/badge/CI-Final%20Matrix-brightgreen) ![Coverage ≥90%](https://img.shields.io/badge/Coverage-%E2%89%A590%25-blue)


## Security
- Vulnerability reports: see `/.well-known/security.txt`
- Images are **signed** with **cosign keyless** during release workflows.

## Security Status
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/your-org/soulsync/badge)](https://securityscorecards.dev/viewer/?uri=github.com/your-org/soulsync)


## AI
- Provider is selected via `AI_PROVIDER` (default `mock`).
- Experimental routes: `/ai/summarize`, `/ai/classify` are **feature-gated** via `FEATURE_AIAPI`.
- Optional moderation middleware can be enabled with `FEATURE_AI_MODERATION=on`.

## AI Extensions (feature-gated)
- **Moderation**: enable with `FEATURE_AI_MODERATION=on`
- **Recommendations**: enable with `FEATURE_AIREC=on`
- **Summaries**: enable with `FEATURE_AISUMMARY=on`
- **Intent detection**: enable with `FEATURE_AIINTENT=on`
- **PII redaction**: enable with `FEATURE_AIPII=on`
- **Anomaly detection**: enable with `FEATURE_AIANOM=on`

## Health checks
Configure POSTGRES_URL / REDIS_URL for real `/readyz` checks.

## pgvector setup
Run `backend/db/schema_pgvector.sql` and use `PgVectorRepo` for KNN.

## OpenTelemetry
Set `OTEL_ENABLE=on` and `OTEL_EXPORTER_OTLP_ENDPOINT`.

## Migrations
- Run: `cd backend && POSTGRES_URL=... PGVECTOR_INDEX=HNSW npm run db:migrate`

## Seeding
- Run: `cd backend && POSTGRES_URL=... npm run db:seed` to insert demo embeddings.

## Prometheus metrics
- Enable: `FEATURE_PROM_METRICS=on`. Scrape `/metrics`.

## Circuit breakers & retries
- Enable: `FEATURE_BREAKERS=on` (env tune: BRK_TIMEOUT/BRK_ERR_PCT/BRK_RESET).

## KNN test (optional)
- Set `TEST_PGVECTOR=on` and `POSTGRES_URL` to run `e2e/knn.test.ts`.


## Tech Stack & Modules

| Area | Tech / Module |
|------|---------------|
| Backend | Node.js (Express), Prisma, Vitest, k6 |
| Frontend | React + Vite + Capacitor |
| Observability | Prometheus, Grafana, Alertmanager, Loki (future) |
| CI/CD | GitHub Actions (CI, Coverage, Release-please, CodeQL, Dependabot, Renovate) |
| AI helpers | ChatGPT integrations, perf-gate, therapy engine modules |
| Docs & Support | [README_FINAL_SETUP.md](README_FINAL_SETUP.md), [SECURITY.md](SECURITY.md), [SUPPORT.md](SUPPORT.md) |

## API Docs
- OpenAPI spec: [`backend/openapi.yml`](backend/openapi.yml)
- Swagger UI: `http://localhost:3000/docs/swagger`
- Redoc: `http://localhost:3000/docs/redoc`

### Auto-generated API Docs
- On app start, [express-oas-generator](https://www.npmjs.com/package/express-oas-generator) creates `backend/openapi.json`.
- It is served at `http://localhost:3000/docs/openapi.json`.
- Swagger/Redoc can be pointed to this for live docs.

## API Versioning
- Main endpoints now live under `/api/v1/` (e.g. `/api/v1/therapy`, `/api/v1/nutrition`).
- Health endpoints (`/healthz`, `/readyz`) stay at root for monitoring.
- Breaking changes must bump version to `/api/v2/...`.

## CI Breaking Change Guard
- CI uses `openapi-diff` to check for incompatible changes in `openapi.json`.
- If breaking changes are found, the build fails unless you bump the version.

## Audit Logging
- Every call to `/api/v1/therapy` and `/api/v1/nutrition` is logged in the `AuditLog` table.
- Logged fields: `userId`, `endpoint`, `status`, `createdAt`.
- Useful for security, debugging, and compliance.
- Check logs via `npx prisma studio` or database queries.

## JWT RBAC
- Admin endpoints accept `Authorization: Bearer <jwt>`
- Token must be signed with `ADMIN_JWT_SECRET` and contain `{ role: 'admin' }`

## E2E Tests
- Run with `npm run test:e2e` (requires Playwright)
- Verifies `/admin/audit-logs` renders and shows export buttons

## Grafana Contact Points
- Auto-provisioned via `observability/grafana/provisioning/alerting/contact-points.yml`
- Includes Email + Slack (warnings, critical)


## JWT Key Rotation
- Use `ADMIN_JWT_KEYS` as a comma-separated list: first key is the **active signer**, others are accepted for verification.
- Example: `ADMIN_JWT_KEYS=secret_new,secret_old1,secret_old2`
- Rotate by prepending the new key and redeploying.


## Frontend Admin Guard
- The admin dashboard checks `localStorage.role === 'admin'` and redirects to `/login` otherwise.
- For local testing: `localStorage.setItem('role','admin')` in the browser console.


## E2E in CI
- GitHub Actions workflow `.github/workflows/e2e.yml` runs Playwright smoke tests on PRs and main.


## Notification Policies
- Grafana maps alerts by `severity` annotation:
  - `warning` -> Slack Warnings
  - `critical` -> Slack Critical
  - default -> Email Team


## JWT via JWKS
- If `ADMIN_JWT_JWKS_URL` is set, jwtGuard will use jwks-rsa to fetch public keys.
- Example: `ADMIN_JWT_JWKS_URL=https://example.com/.well-known/jwks.json`


## Loki Logging
- Promtail scrapes backend/frontend logs from `/var/log` and pushes to Loki.
- `docker-compose.override.yml` runs Loki and Promtail.
- Grafana automatically gets Loki datasource (http://loki:3100).


## Grafana Dashboards
- Provisioned dashboards include:
  - Backend API: requests, error rate, latency
  - System Metrics: CPU, memory, disk
  - Logs Explorer: backend & frontend logs (via Loki)


## Structured Logging
- Backend uses pino for JSON logs to `/var/log/backend/app.log`
- Promtail ingests these logs into Loki, viewable in Grafana Logs Explorer


## Alert Annotations
- Dashboards now show alert markers (red/yellow) when Prometheus alerts fire.
- Backend dashboard shows 5xx spikes, System dashboard shows high memory usage.

## Recording Rules
- `backend:error_rate_5m` : Precomputed 5xx error rate (5m)
- `system:memory_usage_pct` : Memory usage %

## Slack Enrichment
- Alertmanager uses `alertmanager-templates.tmpl` to format Slack messages.
- Messages include severity emoji, job, summary, and link to Grafana graph.


## SLO/SLI Monitoring
- Recording rules (`observability/prometheus/sli-rules.yml`):
  - `sli:availability_30d` – 30d availability % based on http_requests_total.
  - `sli:latency_p95_30d` – p95 latency over time (using histogram buckets).
- Dashboard: **SLO Overview** (availability gauge, p95 latency, error budget remaining).
- Alerts:
  - Critical if availability < 99.9% (30d).
  - Warning if p95 latency > 500ms.


## Burn-rate Alerts
- Fast burn: availability (1h) < 99.9% → Critical
- Slow burn: availability (6h) < 99.9% → Warning
- Based on SLI recording rules `sli:availability_1h` and `sli:availability_6h`.


## Tracing (OTel + Tempo)
- OTel SDK enabled in `backend/src/tracing.js` (auto-instrumentations).
- Collector at `otel-collector:4318` exports traces to Tempo.
- Grafana has **Tempo** datasource and **Tracing dashboard**.


## Trace ↔ Logs Correlation
- Backend emits `trace_id` in JSON log lines (pino) and sets `X-Trace-Id` header.
- Promtail extracts `trace_id` and forwards as Loki label.
- Grafana Loki datasource has **derived field** to open traces in Tempo from logs.


## Signed Exports
- Create a short-lived URL via `GET /api/v1/admin/audit-logs/export-signed?format=csv&ttl=300`
- Download with the returned `export-download?token=...` link.
- Per-user throttle: max 5 exports / 10 min; configure secret via `EXPORT_SIGNING_SECRET`.


## Async Exports (BullMQ)
- Small exports (<= EXPORT_MAX_SYNC) return immediately using sync path.
- Large exports: `POST /api/v1/admin/audit-logs/export-request` → returns `jobId`.
- Poll `GET /api/v1/admin/audit-logs/export-status/:id` to retrieve a temporary download URL.
- Requires Redis (`REDIS_URL`) and worker process: `npm run worker:export`.


## AI Insights
- Endpoint: `GET /api/v1/admin/audit-logs/insights` (filters optional)
- Uses external AI provider if `AI_PROVIDER_URL` (+ `AI_API_KEY`) is configured, else heuristic fallback.


## Dev Trace Fetch Patch
- `frontend/src/setupDevFetchPatch.js` auto-adds `X-Trace-Id` on fetch in development builds.


## Metrics Cardinality Guard
- Route normalization: numbers → :id, UUID → :uuid, long hex → :hex; query string uklonjen.
- Label values truncated na 64 znaka (sprječava label explosion).


## Rate Limiting
- Global: `RATE_LIMIT_GLOBAL_MAX` req / `RATE_LIMIT_WINDOW_MS` ms (feature: `FEATURE_RATE_LIMIT`).
- Export endpoints: `RATE_LIMIT_EXPORT_MAX` / `RATE_LIMIT_EXPORT_WINDOW_MS`.


## Exports in Admin UI
- **Download now (Sync)** do `EXPORT_MAX_SYNC` odmah preko signed URL-a.
- **Export (Async)** u pozadini (BullMQ), status u **My Exports** tabu.


## Security Headers & CSP
- Enabled via `helmet`. Feature toggle: `FEATURE_CSP` (default true).
- CSP can run in **report-only**: `CSP_REPORT_ONLY=true` (default), reports go to `CSP_REPORT_URI` (default `/api/v1/csp-report`).
- When stabilised, set `CSP_REPORT_ONLY=false` to enforce.


## AuditLog Indexes
- Added Prisma indexes: `(createdAt)`, `(status)`, `(userId)`, `(createdAt,status)`, `(userId,createdAt)`.


## AI Insights (Tuned)
- External provider payload now guides results (top lists + suggestions + severity 1–5 + costImpact low/medium/high).


## Strict CSP & HTTPS
- Toggle strict CSP (no `'unsafe-inline'`) via `FEATURE_CSP_STRICT=true` (default).
- Optional HTTPS redirect behind proxy: set `TRUST_PROXY=true` and `FORCE_HTTPS=true`.
- HSTS enabled by default (`ENABLE_HSTS=true`).


## CSP Nonce Mode
- Dynamic nonce per request via middleware (`backend/src/middleware/cspNonce.js`).
- Enable with `FEATURE_CSP_NONCE=true` (default). When `FEATURE_CSP_STRICT=true`, `script-src`/`style-src` require a matching nonce.
- If imaš inline `<script>` ili `<style>`, dodaj `nonce={res.locals.cspNonce}` na tag (SSR/template).  
  React/Vite bundlovi tipično koriste vanjske fajlove pa nonce nije potreban.
# reindex trigger Wed Oct 22 15:29:09 CEST 2025
