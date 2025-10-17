# Top-Tier Production Readiness — Quick Guide

## Security
- **Helmet** enabled (CSP handled by NGINX).
- **CORS allowlist** bound to `CLIENT_ORIGIN`.
- **Trust proxy** set (correct IPs and rate-limit behavior).
- Backend headers: `X-Powered-By` disabled.

## Correctness
- **Zod** request+response validation:
  - `/api/auth/login` (strict)
  - `/api/reports/daily/send-now` (permisivno za početak; pooštri kada definiraš payload)
  - `/api/webhooks/:id/test` (permisivno; pooštri payload i path param validation)

## Performance
- NGINX: **gzip** + **asset caching (1y)**, **no-cache HTML**.
- Frontend: size budgets via **size-limit** CI.

## DX & Governance
- **Husky + lint-staged** (pre-commit format & lint), **commitlint** (conventional commits).
- **Gitleaks**, **Spectral**, **CodeQL**, **Codecov**, **semantic-release**, **Dependabot**.

## Next tightening (optional)
- Add path param validation with `zod-router` or custom middleware.
- Expand strict request schemas for all public routes.
- Add CSP allowances for Sentry/analytics if used.

