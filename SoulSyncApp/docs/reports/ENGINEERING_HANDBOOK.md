# SoulSync Engineering Handbook

This is the consolidated guide for coding, building, testing, releasing and deploying the SoulSync app.

## Monorepo Structure
- `frontend/` — React + Vite + TS (HR/EN i18n), Sentry, tests (Vitest), sourcemaps enabled.
- `backend/` — Express + TS, security middleware (rate-limit, headers, idempotency, audit), Prometheus metrics, Sentry.
- `mobile/` — Capacitor (single canonical `capacitor.config.ts`).
- `packages/sdk-rest/` — OpenAPI-generated REST client (axios), published to GitHub Packages (optional).
- `ops/`, `deploy/`, `infra/` — deploy assets, legal, monitoring.

## Local Dev
```bash
npm i
npm run lint
npm run typecheck
npm run build
npm test
```

### Frontend
```bash
npm -w frontend run dev
npm -w frontend run build
```

### Backend
```bash
npm -w backend run dev
npm -w backend run build && npm -w backend start
```

### Mobile (Capacitor)
```bash
# build web then sync native
npm -w mobile run sync
npm -w mobile run ios
npm -w mobile run android
```

## Environment & Config
- See `ENV_MATRIX.md` and `.env.example` files.
- Backend `/metrics` can be gated via `METRICS_TOKEN` (Authorization: Bearer).
- Release version is injected via `RELEASE_VERSION` (backend) and `VITE_RELEASE` (frontend).

## Testing & Quality
- Lint + Typecheck + Unit/E2E tests required via Branch Protection.
- Coverage uploaded to Codecov (recommended as required check).
- CodeQL static analysis configured.

## Releases
Two-step flow:
1) **semantic-release** on `main` → bumps version, generates CHANGELOG, creates GitHub Release + tag.
2) **release-all-in-one** on tag push → builds frontend (sourcemaps to Sentry), builds backend, generates SDK & optionally publishes, triggers Render deploy hooks.

## Observability
- `/healthz`, `/readiness`
- `/metrics` (Prometheus) with `build_info` gauge
- Sentry: frontend + backend

## Store Readiness
- iOS: `Info.plist` privacy keys (Camera/FaceID/Photo/Notifications) included.
- Android: runtime permissions, targetSdk 34, icons/splash, Data Safety form.
- See `STORE_CHECKLIST.md`.

## Security
- Rate limiting, CORS, security headers, audit logs, idempotency keys.
- Admin `/admin/diagnostics` protected with Basic Auth.
- Keep secrets in CI secrets, not in repo.

## SDK
- `npm -w packages/sdk-rest run gen` to regenerate from `backend/openapi.yaml`.
- Optional publish to GitHub Packages via `GITHUB_PACKAGES_TOKEN`.

