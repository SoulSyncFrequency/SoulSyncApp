# SoulSync Audit — v101.5.34_ultra28
Generated: 2025-09-20T13:12:41.266701Z

## Snapshot
- Structure: `frontend` (Vite/React/TS), `backend` (Express/TS + Drizzle), `mobile` (Capacitor), `packages/sdk-rest`
- CI: 24 workflows (build-matrix.yml, changelog.yml, codecov.yml, codeql.yml, coverage.yml, docker.yml, docs.yml, e2e.yml…)
- Dockerfile: True
- Render config: True
- Health endpoints: present (backend/src/server.ts, backend/src/health.ts, backend/src/system.routes.ts…)
- Sentry: frontend + backend integrated
- i18n: hr/en present
- OpenAPI: `backend/openapi.yaml`
- Legal: 30 privacy/terms-related files

## Versions
- Frontend: **80.0.0** (soulsync-frontend)
- Backend: **80.0.0** (backend)
- Mobile: **80.0.0** (soulsync-mobile)

## What looks strong ✅
- Robust CI set (lint, typecheck, tests, coverage → Codecov, CodeQL, security & secrets scans).
- Backend hardened: rate limits, audit log, security headers, CORS, idempotency, request IDs, Prometheus metrics.
- Sentry wired both sides; health/readiness endpoints; OpenAPI spec.
- Render config provided; .env examples in `ops/` plus infra/deploy assets.
- E2E tests folders exist for key flows.

## Risks & Cleanups 🧹
- **Duplicate configs**: .eslintrc.cjs + .eslintrc.json (keep one), .prettierrc + .prettierrc.json (keep one), Multiple capacitor.config files: 9.
- **Capacitor configs**: multiple `capacitor.config.*` in root, frontend, and mobile → keep **one** canonical (recommend `mobile/capacitor.config.ts` that points to `../frontend/dist`).
- **iOS Info.plist privacy strings likely missing** (camera/notifications/FaceID). Add the snippets in `ios_info_plist_inserts.txt`.
- **Android manifest** includes CAMERA & storage; make sure runtime permission requests are implemented on Android 13+ (Capacitor Plugins handle but verify).
- **Version skew**: app packages show `80.0.0` while zip is `v101.5.34_ultra28`. Unify versions or adopt independent versioning.
- **Dockerfile**: current root Dockerfile builds whole repo and runs `npm run start` from root — fragile for monorepo. Use per-service Dockerfiles (see `Dockerfile.backend`/`Dockerfile.frontend`).
- **Self-healing**: `backend/src/selfheal.ts` is a stub. Either implement health watchdog or remove references.
- **Vite config** appears truncated in repo (`vite.config.ts` contains an ellipsis artifact). Verify file integrity.
- **Multiple legal templates/duplicates** in deploy/infra inflate repo; keep a single source of truth under `frontend/public/legal/`.

## Frontend envs (scan)
```
ANALYZE, MODE, NODE_ENV, PROD, VITE_API_BASE, VITE_API_BASE_URL, VITE_API_URL, VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_SENDER_ID, VITE_PRICE_MONTHLY, VITE_PRICE_YEARLY, VITE_SENTRY_DSN, VITE_SENTRY_ENVIRONMENT, VITE_SENTRY_RELEASE, VITE_SENTRY_REPLAY, VITE_SENTRY_TRACES_SAMPLE_RATE, VITE_VAPID_PUBLIC_KEY
```

## Backend envs (scan)
```
ACCEPT_CLIENT_REQUEST_ID, ADMIN_API_TOKEN, ADMIN_SECRET, ADMIN_TOKEN, AI_PROVIDER, ALLOWED_CONTENT_TYPES, API_CACHE_CONTROL, API_RATE_LIMIT_ENABLE, API_RATE_LIMIT_LIMIT, API_RATE_LIMIT_WINDOW_MS, API_VERSION, APNS_AUTH_KEY, APNS_BUNDLE_ID, APNS_KEY_ID, APNS_TEAM_ID, APP_PLATFORM, APP_URL, AUDIT_IGNORE_PATHS, AUDIT_LOG_JSON, AUDIT_SAMPLE_RATE, AUTH_RATE_LIMIT_LIMIT, AUTH_RATE_LIMIT_WINDOW_MS, AZURE_OPENAI_KEY, BLOCKED_UA_PATTERNS, BUILD_TIME, CLIENT_ORIGIN, COOKIE_HARDENING, COOKIE_SAMESITE_DEFAULT, DATABASE_URL, DEFAULT_WEBHOOK_SECRET, DEPRECATION, DEPRECATION_LINK, DISCORD_WEBHOOK_URL, DOCS_BASIC_AUTH, DRAIN_TIMEOUT_MS, EMAIL_CONCURRENCY, EMAIL_FROM, ENABLE_API_DOCS, ENABLE_COMPRESSION, ENABLE_IDEMPOTENCY_GUARD, ENABLE_PATH_GUARD, ENABLE_TEST_ENDPOINTS, ENABLE_X_REQUEST_START, ENFORCE_HTTPS, ENTITLEMENTS_REPO, ENTITLEMENT_PROTECT_PREFIXES, EXPOSE_CLIENT_IP, EXPOSE_HEADERS, FCM_SERVER_KEY, FEATURE_FLAGS, FRONTEND_ORIGIN, GIT_COMMIT, GIT_SHA, HSTS_INCLUDE_SUBDOMAINS, HSTS_MAX_AGE, HSTS_PRELOAD, IDEMPOTENCY_TTL_MS, JSON_BIGINT_STRINGS, JSON_SPACES, JWT_SECRET ...
```

## iOS privacy checks
- file: ios/App/Info.plist
  has_camera: false
  has_biometric: false
  has_photo: false
  has_push: false
- file: mobile/ios/App/Info.plist
  has_camera: false
  has_biometric: false
  has_photo: false
  has_push: false


## Android manifest summary
- file: deploy/k8s/SoulSync-Capacitor-Full-with-legal-complete-v20/android/app/src/main/AndroidManifest.xml
  perm_count: 6
  perms:
  - android.permission.CAMERA
  - android.permission.INTERNET
  - android.permission.READ_EXTERNAL_STORAGE
  - android.permission.USE_BIOMETRIC
  - android.permission.VIBRATE
  - android.permission.WRITE_EXTERNAL_STORAGE


## Suggested improvements (smart & high‑impact)
1. **Consolidate configs**: keep `.eslintrc.cjs` OR `.eslintrc.json` (not both), and `.prettierrc` OR `.prettierrc.json`. Add `eslint-config-turbo` if adopting workspaces.
2. **Monorepo polish**: add `pnpm-workspace.yaml` and convert to pnpm workspaces (`frontend`, `backend`, `mobile`, `packages/*`), enabling shared dev scripts and caching. Add root `typecheck`, `lint`, `build` that run all packages.
3. **Docker & Render**: split images; enable health checks (`/healthz`), and set `SIGTERM` graceful shutdown (ensure Express handles). Use distroless for backend to cut image size and CVEs.
4. **Store‑ready mobile**: 
   - iOS: add privacy usage keys (camera/FaceID/notifications/photo). Confirm Bundle ID `com.soulsync.app` across configs.
   - Android: verify `targetSdkVersion` 34, enable V2/V3 signing, use **Hermes** JS engine if RN used (not needed for Capacitor), and check adaptive icon & 512×512 Play icon.
5. **Secrets & configs**: ensure **NO** prod secrets in repo; keep `.env.example` minimal but complete. Add `CONFIG_VALIDATION.md` auto‑generated from Zod schema if available.
6. **Sentry releases**: add release name and source maps upload for frontend; backend profiling only in prod.
7. **OpenAPI client**: generate `@soulsync/sdk-rest` from `backend/openapi.yaml` in CI to prevent drift; publish to npm (private) on GitHub Packages.
8. **Observability**: confirm `/metrics` is gated or separate route; add `RED` metrics; add structured logs → ship to Loki via Promtail (files exist under `ops/`).
9. **RBAC & Admin console**: lock `/admin/diagnostics` behind admin guard and basic auth in non‑dev.
10. **Release hygiene**: ensure `CHANGELOG.md` is written by `release-please` or `semantic-release` using your `.releaserc.json`.
11. **Capacitor flow**: use `mobile` package as the only place to run `npx cap sync/open`; its `build:web` should build frontend and copy output; remove other `cap:*` scripts in frontend to avoid confusion.

---

_Artifacts generated alongside this report:_
- `Dockerfile.backend` (suggested)
- `Dockerfile.frontend` (suggested)
- `render.yaml.suggested`
- `ios_info_plist_inserts.txt`
- `ENV_MATRIX.md` with full env var list per service

