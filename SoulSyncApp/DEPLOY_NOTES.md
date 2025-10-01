# Deployment Notes

## Environment Protections
- Staging and Production workflows declare `environment: staging` or `environment: production`.
- GitHub Environments can enforce **required reviewers** and **secrets scoping**.

## Helm Diff
- Trigger `Helm Diff` workflow manually to preview changes:
```
helm diff upgrade soulsync ./helm -n default --values ./helm/values.yaml
```
- Output shows which resources would change before applying.

## Notifications
- Workflows send Slack notification if `SLACK_WEBHOOK_URL` secret is set.
- Message includes workflow name, tag/version, job name, and status (success/failure).

## Helm Test
- After deploy, Helm tests can be run to validate resources:
```
helm test soulsync -n default
```

- If tests fail, workflows are configured to rollback automatically.

## Slack Failure Notifications
- On failed tests, a Slack notification is sent with `SLACK_COLOR=danger` and message about rollback.

## Progressive Rollout
- Use `progressive-rollout.yml` to gradually increase canary traffic:
  - 25% → 50% → 100%

## Health Checks & Smoke Tests
- Trigger `health-checks.yml` to verify:
  - /healthz
  - /version
  - /me (mock token)
  - /therapy/suggestions

## Advanced Slack Notifications
- Slack messages now include links:
  - to GitHub Actions run logs
  - to Grafana dashboards (if `GRAFANA_URL` secret is set)
