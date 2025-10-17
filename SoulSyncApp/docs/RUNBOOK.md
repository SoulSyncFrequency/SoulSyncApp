# RUNBOOK

## Daily
- Check dashboards: Sentry issues, Prometheus error rate, p95 latency.
- Review Dependabot PRs.
- Ensure CI green on `main`.

## On-call
1. **High 5xx rate alert** fires:
   - Inspect `/metrics` for spikes.
   - Check recent deploy (tag + release notes).
   - Roll back by redeploying previous tag (Render → Deploys).

2. **Sentry error spike**:
   - Check release version in event (`build_info` and Sentry `release` tag).
   - Create issue with stack + steps to reproduce.

## Deploy
- Merge to `main` → `semantic-release` will cut a release.
- Check GitHub Releases; tag `vX.Y.Z` triggers the all-in-one pipeline + Render deploy hooks.

## Rollback
- Re-deploy previous successful tag via Render (or re-run pipeline on old tag).

## Backups & Data
- Ensure database snapshots daily (configure at provider).
- Test restore quarterly.

