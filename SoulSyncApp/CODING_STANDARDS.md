# Coding Standards

## Languages & Tooling
- TypeScript everywhere (`"strict": true`, `noUncheckedIndexedAccess: true`)
- ESLint + Prettier enforced via Husky (`pre-commit`)
- Commit style: **Conventional Commits**

## Backend (Express + TS)
- Structure: `src/` features, `routes/`, `middleware/`, `services/`, `db/`.
- **Error handling**: central error middleware; never `res.send` from service layer.
- **Logging**: use one logger module with request-id; avoid `console.log` in prod paths.
- **Security**: CORS allowlist, security headers, rate-limits, idempotency.
- **Config**: all through `config.ts` (Zod-validated).
- **Testing**: unit tests for services, integration tests for routes.

## Frontend (React + Vite)
- State: prefer React Query for server state; Context for global UI state.
- Components: collocate by feature; no deep index re-exports.
- Routing: file-based or route-config; code-splitting by route; prefetch critical data.
- Errors: boundaries per route; user-friendly fallbacks.
- I18n: HR/EN—no hardcoded strings.

## Mobile (Capacitor)
- Jedan `capacitor.config.ts` u `mobile/`.
- Native perms se deklariraju, a runtime se traže kroz Capacitor pluginove.

## API
- Source of truth: `backend/openapi.yaml`.
- SDK generacija: `packages/sdk-rest` (CI je automatizirao).

