# Audit: ULTIMATE+TORTA
Root: `/mnt/data/extracted/ULTIMATE_TORTA`

## CI Workflows
build-matrix.yml, changelog.yml, codecov.yml, codeql.yml, coverage.yml, docker-build.yml, docker.yml, docs.yml, e2e.yml, gitleaks.yml, lint-build.yml, lint-config.yml, lint-format.yml, lint.yml, meta-check.yml, migrate-dry-run.yml, npm-audit.yml, openapi-lint.yml, osv-scan.yml, predeploy-check.yml, publish.yml, release-all-in-one.yml, release-drafter.yml, release.yml, sdk-rest.yml, secrets-scan.yml, security-scan.yml, sentry-release.yml, sentry-sourcemaps.yml, size-limit.yml, smoke.yml, test-coverage.yml, test.yml, tests.yml, typecheck.yml
## Server wiring
- helmet: ✅
- trust_proxy: ✅
- x_powered_by_off: ✅
- cors_allowlist: ✅
- auditLog_mounted: ✅
- conditionalCache: ✅
- rate_general: ⚠️
- rate_auth: ⚠️
- rate_billing: ⚠️
- rate_reports: ✅
- idempotency_billing: ⚠️
- idempotency_reports: ⚠️
- rbac_billing: ⚠️
- responseValidator: ✅
- requestValidator: ✅
- queryValidator: ✅
- webhook_signature: ✅
- readyz_livez: ✅

## Lint/TS strictness
- no-console error: ✅
- no-explicit-any error: ✅
- frontend exactOptionalPropertyTypes: ✅
- frontend noImplicitOverride: ✅
- backend exactOptionalPropertyTypes: ✅
- backend noImplicitOverride: ✅

## NGINX security/perf
- CSP present: ✅
- HSTS present: ✅
- gzip on: ✅
- brotli on: ✅
- asset long-cache: ✅
- html no-store: ✅

## Errors (RFC 7807)
- problemDetails wired: ✅

## Coverage gate
- jest coverageThreshold lines: 80%

## E2E tests
export-pdf-validation.test.ts, extra-validation.test.ts, reports-rate-limit.test.ts, reports-validation.test.ts, request-validation.test.ts, webhooks-param-validation.test.ts