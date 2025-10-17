# Therapy Engine — Dual‑Mode (Prompt ⟷ 140Q + 10 Follow‑ups)

A production‑ready scaffold that implements your patent‑aligned therapy generator with two entry modes:

1. **Prompt mode** — user pastes their condition/story, optionally uploads labs → full therapy.
2. **Questionnaire mode** — 20 questions × 7 chakras = 140 → engine asks 10 tailored follow‑ups → full therapy.

## Modules integrated

- **F₀ coherence score** (heuristic layer; filter above Hz plan)
- **Frequency plan** mapped to primary chakras (Hz as supportive layer)
- **Bio‑photonic molecule candidate** (for *simulation only*): record format `[F0 | EM | SMILES]`
- **Nutrition & Lifestyle** plan (5 days, policy aligned: *no PUFA seed oils, no nuts/seeds, no oats, no leafy/stem vegetables; focus on animal foods, fruit, tubers, dairy*)
- **Supplements** food‑first; **no fish oil**
- **Safety & Ethics** notes
- **Chem microservice (stub)** for PAINS/toxicity/canonicalization
- **JSON & PDF export**

> ⚠️ **Disclaimer**: Educational prototype. Not medical advice. Use legally and ethically. Psilocybin module only where legal and clinically appropriate.

---

## Quick start (no Docker)

### Backend
```bash
cd backend
cp .env.example .env        # adjust if needed
npm ci
npm start                   # starts at http://localhost:5050
```

### Chem microservice (stub)
```bash
cd chem-microservice
cp .env.example .env
npm ci
npm start                   # starts at http://localhost:7070
```

### Frontend (Vite + React + Tailwind)
```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5050 by default
npm ci
npm run dev                 # http://localhost:5173
# Or production preview:
npm run build
npm run preview             # http://localhost:4173
```

---

## Docker (one command)

```bash
docker compose up --build
```
- Frontend: http://localhost:4173
- Backend:  http://localhost:5050
- Chem:     http://localhost:7070

---

## API

### `POST /api/generateTherapy`
Request (Prompt mode):
```json
{
  "mode": "prompt",
  "text": "I have lower back pain ... anxiety ...",
  "labsText": "TSH: 3.1, CRP: 4.0"
}
```

Request (Questionnaire mode):
```json
{
  "mode": "questionnaire",
  "answers": { "root": [0,1,2,...20], "...": [] },
  "followUps": ["..."],
  "followUpAnswers": ["..."]
}
```

Response (excerpt):
```json
{
  "f0": 0.71,
  "primaryChakras": ["root","solar"],
  "hz": [{"chakra":"root","hz":396},{"chakra":"solar","hz":528}],
  "smiles": {"label":"...","record":"[F0 0.71 | EM ... | SMILES ...]"},
  "diet": [ ... 5 days ... ],
  "supps": ["Creatine", "..."]
}
```

### Curl test
```bash
curl -s http://localhost:5050/api/generateTherapy   -H 'Content-Type: application/json'   -d '{"mode":"prompt","text":"lower back pain for 2y, anxiety worse at night","labsText":"TSH:3.1 CRP:4.0"}' | jq
```

---

## Project structure

```
therapy-engine/
├─ backend/                # Express API (/api/generateTherapy)
├─ chem-microservice/      # Stubbed PAINS/tox/canonicalization
├─ frontend/               # Vite+React+Tailwind UI
├─ docker-compose.yml
└─ README.md
```

---

## Environment

- Node.js >= 18
- Docker (optional) and Docker Compose v2

---

## Notes

- **Nutrition & Lifestyle** policy is fully embedded (no PUFA, no nuts/seeds, no oats, no leafy/stem veg).
- **Supplements** are food-first and never include fish oil (use whole seafood instead).
- The chem microservice is intentionally conservative and non-claiming.


---

## New in this build

- **Backend PDF export**: `POST /api/exportPdf` (send `{ therapy: {...} }`) → returns `application/pdf`.
- **Patent/PCT Report (DOCX or PDF)**: `POST /api/exportPatentReport` with `{ therapy, format: "docx"|"pdf" }`.
- **SQLite storage** (default): therapy objects are saved automatically and response contains `id`.
  - `GET /api/therapies?limit=50`
  - `GET /api/therapies/:id`
- **Chem microservice rules**: extended `POST /validate` with simple PAINS/tox flags (stubbed, non-claiming).

### Extra ENV
- Backend: `SQLITE_PATH=./sqlite.db` (default), `DATABASE_URL` (optional for future Postgres wiring).

### Frontend
- Dodani gumbi: **Server PDF** i **PCT Report (docx)** za izravan download iz backenda.


---

## Authentication & Database (NEW)

- **JWT login**: `/auth/register`, `/auth/login`, `/me`.
- **Therapies saved per user** if Authorization header is present (Bearer token).
- **DB fallback**: defaults to **SQLite**. If `DATABASE_URL=postgres://...` is set, backend uses **Postgres**.
- **Docker compose** includes a ready **Postgres** service (db). To use it, set:
  - `DATABASE_URL=postgres://app:app@db:5432/therapy` in `backend/.env`

### Auth Endpoints

- `POST /auth/register` `{ "email": "...", "password": "..." }`
- `POST /auth/login` `{ "email": "...", "password": "..." }` → `{ token }`
- `GET /me` (Authorization: Bearer) → `{ id, email, created_at }`

Therapy endpoints now associate `user_id` when token is provided.

### Frontend
- Dodan je **Login/Register** panel (u gornjem desnom kutu). Nakon login-a, gumb **My Therapies** učita listu spremljenih terapija (samo za prijavljenog korisnika).


---

## Push & Reminders

### Local (offline) reminders
- Capacitor **Local Notifications**: zakazivanje 5 podsjetnika (09:00 lokalno) za 5-dnevni plan.
- UI gumb: **Set 5-day reminders** (vidljiv nakon generiranja terapije).

### Server push (FCM/APNs via FCM)
- Dodan endpoint **POST /push/register** – klijent šalje `platform` i `token` nakon registracije na push.
- **POST /push/test** – šalje testnu poruku svim tokenima prijavljenog korisnika (traži Bearer token) preko FCM-a.
- Postavi `FCM_SERVER_KEY=` u `backend/.env` (Firebase Cloud Messaging **legacy** ključ ili Service Account proxy).
- iOS i Android zahtijevaju dodavanje `GoogleService-Info.plist` / `google-services.json` u **native** projekte.
  - iOS: Xcode → dodaj `GoogleService-Info.plist` u iOS app target.
  - Android: `android/app/google-services.json` + Gradle plugin.

> Napomena: FCM Legacy HTTP API je deprecated, koristi se ovdje radi jednostavnosti prototipa. Za produkciju preporučen je **HTTP v1** s Google Cloud Service Account-om.


---

## Security & Compliance (added)

- **Helmet** + **Rate limiting** prekonfigurirano (global, + jači limit na /auth/*).
- **Audit logs** (`audit_logs` tablica) bilježi aute, generiranja terapija i push testove.
- **OAuth Apple/Google**: `/auth/oauth/apple` i `/auth/oauth/google` (prima `id_token` iz nativnog logina; koristi JOSE JWKS verifikaciju).
- **2FA (TOTP)** hooks: `/auth/2fa/setup` → `{ otpauth, secret }`, `/auth/2fa/verify` → `{ ok }`.
- **Biometric unlock** u mobilnoj aplikaciji (Fingerprint/FaceID) — toggle u headeru.
- **Legal**: `PrivacyPolicy.md`, `TermsOfService.md` dodani u root.

### ENV podsjetnik
- Backend: `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOTP_ISSUER`
- Frontend: `VITE_GOOGLE_CLIENT_ID`, `VITE_APPLE_CLIENT_ID`
- Za push: `FCM_SERVER_KEY` i native datoteke `google-services.json` / `GoogleService-Info.plist`

### Publish checklist
- iOS: Sign in with Apple obavezan ako nudiš Google login.
- Play Store: dodaj Privacy Policy URL i kontakt email.
- Oba store-a: postavi **age rating** i obavezne disclaimere.


---

## Sentry release tagging
- Skripta: `ops/scripts/set_sentry_release.sh` postavlja `SENTRY_RELEASE` i `VITE_SENTRY_RELEASE` iz `GITHUB_SHA`.
- Backend i frontend propagiraju release u Sentry initu.

## TLS opcije
1) **Let's Encrypt (Certbot + Nginx)**  
   - `ops/nginx/nginx.ssl.conf` (zamijeni `YOUR_DOMAIN`).  
   - `docker-compose.prod.ssl.yml` — dodaje `certbot` servis i mounted volume-e.  
   - Prvi cert: `DOMAIN=example.com EMAIL=you@example.com ./ops/scripts/request_cert.sh`  
   - Nakon toga: certbot container automatski provjerava i obnavlja cert svakih 12h.

2) **Cloudflare Full (Origin cert)**  
   - Generiraj Origin cert i key u Cloudflare → stavi u `ops/nginx/certs/origin.crt` i `origin.key`.  
   - Koristi `ops/nginx/nginx.cloudflare.conf` i mapiraj u Nginx umjesto default conf.

## GitHub Actions (CI/CD)
- `.github/workflows/ci.yml` — build & push Docker image-e na **GHCR** (backend, chem, frontend).  
- Postavi secretes: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_PROJECT_FRONTEND`.  
- Image tag je `${{ github.sha }}`; možeš u deployu povući točnu verziju.



---

## Monitoring & Health

- **/health** endpoint is proxied by Nginx to backend — returns `{ ok: true }` with DB mode.
- **/nginx_status** exposed (stub_status).
- Optional **Uptime Kuma** stack (`docker-compose.monitor.yml` → http://SERVER:3001).

## CI/CD Auto-deploy
- `deploy.yml` (GitHub Actions) deploya na server preko SSH (trebaju secreti: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `REPO_SSH`, `REMOTE_PATH`, opcionalno `BACKEND_ENV`, `FRONTEND_ENV`).
- Server skripte: `ops/deploy/setup_server.sh` (Docker/Compose setup) i `ops/deploy/pull_and_restart.sh` (git pull + compose up).

## Store Listing Templates
- `store/apple_description.txt`, `store/apple_keywords.txt`
- `store/google_title.txt`, `store/google_short_description.txt`, `store/google_full_description.txt`
- `store/apple_privacy_template.json`
- Ikone/splash: `store/assets/` (SVG masteri)



---

## Feature Flags & Regions
- Backend ENV:
  - `FEATURE_PSY=true|false` (default true)
  - `REGION_ALLOW_PSY=US,CA,BR,NL` (empty = allow all; header: `CF-IPCountry` or `x-country`)
- Endpoint `/geo` returns `{ country }` for UI hints.

## Demo Billing IDs
- Backend `.env.example` includes demo Stripe keys and `PREMIUM_PRICE_ID` (replace in prod).
- Frontend `.env.example` includes `VITE_PREMIUM_PRICE_ID` for display purposes.

## Screenshots Automation
- Frontend devDependency: **puppeteer**.
- `ops/screenshots/snapshots.js` starts `vite preview` and snima:
  - `screenshots/01_landing.png`
  - `screenshots/02_demo_therapy.png`
- GitHub Actions workflow: `.github/workflows/screenshots.yml` → upload kao artifact.



---

## Generic Module Gating
- `FEATURE_MODULES` (JSON) — npr. `{"psilocybin":false,"c60":true}`
- `REGION_ALLOW_MODULES` (JSON) — npr. `{"psilocybin":["US","CA","NL"],"emdr":["US","HR"]}`
- Backend automatski filtrira `therapy.modules` ovisno o feature flagovima i zemlji (header `CF-IPCountry` ili `x-country`).

## In-App Purchases (Optional runtime)
- `mobile/iap/iapClient.js` — dinamično traži plugin (`Capacitor.Plugins.InAppPurchases` ili sličan).
- Frontend gumb **Buy via App Store/Play** koristi ovaj klijent; fallback je Stripe Checkout.

## Screenshots (EN/HR + više stateova)
- `ops/screenshots/snapshots.js` generira set:
  - 01_en_landing, 02_en_login, 03_en_demo_therapy, 04_en_questionnaire
  - 05_hr_landing, 06_hr_demo_therapy, 07_hr_questionnaire



---

## Enterprise Additions
- **RBAC / Admin**: admin-only endpoint `/admin/stats`, JWT now sadrži `role`. Dodan `role` i `accepted_terms_at` u `users` tablicu.
- **API Keys**: kreiranje/listanje/revoke (`/admin/apikeys/*`) + `x-api-key` middleware skeleton.
- **Metrics**: `/metrics` (Prometheus) + brojanje http_requests i therapies_generated.
- **Outbound webhooks**: `WEBHOOK_URL` — šalje `therapy.created` event.
- **Remote flags**: `/config` vraća feature flagove s udaljenog JSON-a (keš 5 min).
- **Multi-tenant brand**: `/brand` određuje ime/primarnu boju po Host headeru.
- **Migrations**: jednostavan placeholder (`backend/migrate.js`), DB alteri u kodu.
- **Backups**: `ops/backup/pg_dump.sh` za ručni dump.
- **RevenueCat**: `/billing/revenuecat/webhook` skeleton.
- **Playwright E2E**: `e2e/` sample test.
- **i18n seeds**: `src/locales/en.json`, `src/locales/hr.json` + `t(lang,key)` helper.
- **Terms acceptance**: checkbox pri registraciji, backend sprema `accepted_terms_at`.



---

## Onboarding & Telemetry
- **Onboarding** prikazuje dobrodošlicu, privatnost i disclaimer (3 koraka) pri prvom pokretanju.
- **Telemetry opt-in**: korisnik može uključiti/isključiti slanje crash/perf izvještaja (Sentry) u Onboardingu ili Settings.
  - `localStorage.telemetry = "1"` → Sentry se inicijalizira; inače je isključen.

## Data Retention (optional)
- `RETENTION_DAYS` u backend `.env` (default: prazno/0 = nema brisanja).
- Dnevni job briše **anonimne** terapije starije od X dana.

## Brand Asset Builder
- `node ops/brands/build_brand_assets.js [brands.json] [out_dir]` → generira SVG ikone i splashove po brandu.
- Preporuka: import PNG preko `@capacitor/assets` za iOS/Android.

## Features endpoint
- `GET /billing/features` → `{ premium, features:[...] }` za UI gating.


---

## Store Submission Checklist (iOS / Android)
- [ ] App icons & splash: generiraj SVG → PNG (`ops/brands/build_brand_assets.js` + `render_png_from_svg.js`), pa `@capacitor/assets`.
- [ ] Privacy: popuni **Apple Privacy Labels** (vidi `store/apple_privacy_labels.md`) i **Play Data Safety** (`store/google_data_safety.json`).
- [ ] Legal: Privacy Policy + Terms u appu i na webu (linkovi u store listing).
- [ ] Sign in with Apple ako koristiš Google login (već uključeno).
- [ ] Screenshots: pokreni workflow `screenshots.yml` (EN/HR stateovi).
- [ ] Crash/perf telemetry: **opt‑in** (Sentry), jasno navedeno u Privacy Labels.
- [ ] GDPR: provjeri `/me/export` i `DELETE /me`.
- [ ] TLS: Certbot/Cloudflare konfiguracija ok; HSTS na edgeu preporučen.
