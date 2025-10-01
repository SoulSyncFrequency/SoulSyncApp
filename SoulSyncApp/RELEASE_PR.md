# Release PR – v1.0.0

## Summary
- Finalize SoulSync backend v1.0.0 with production build, security hardening, OpenAPI docs, tests, CI/CD, observability.

## Checklist
- [ ] Bump `VERSION` if needed
- [ ] `npm ci && npm run build --workspace=backend`
- [ ] `npm run openapi:gen --workspace=backend && npm run openapi:yaml --workspace=backend`
- [ ] `npm run test:all --workspace=backend`
- [ ] `docker build -t ghcr.io/<org>/soulsync-backend:1.0.0 ./backend`
- [ ] `docker run -p 3000:3000 --env-file .env ghcr.io/<org>/soulsync-backend:1.0.0`
- [ ] Smoke test `/healthz`, `/readyz`, `/metrics`, `/api/docs`, `/admin/queues/ui`
- [ ] Update `charts/soulsync/values-production.yaml` tag to `1.0.0`
- [ ] `helm upgrade --install soulsync charts/soulsync -f charts/soulsync/values-production.yaml`
- [ ] Tag and push: `git tag v1.0.0 && git push --tags`
- [ ] Verify GH Release (Release Drafter), GHCR image (Docker Publish), CI green
- [ ] Update runbook contacts and alert emails

## Notes
- Metrics token recommended in prod (`METRICS_TOKEN`).
- Admin UI can be disabled in prod: `ADMIN_UI_ENABLED=false`.


## Highlights
- 🔐 Security: non-root Docker, read-only FS, rate-limits, CSRF, CSP report-only, Dependabot, Trivy scans.
- 📊 Observability: Prometheus metrics, Grafana dashboards, alerts, tracing with traceId.
- ⚙️ Ops: Runbook, Operations doc, Helm charts (staging/prod), Render guide, PDB, HPA, NetworkPolicy.
- 📦 CI/CD: GitHub Actions for lint/test/coverage, Docker publish to GHCR, release drafter, semantic versioning.
- 📱 Store readiness: Privacy Policy, Security, Support docs, App/Play Store checklists, Status page (HTML).
- 🌐 Monitoring: Optional Uptime Kuma docker-compose skeleton for full monitoring stack.
