# Final Launch Checklist – SoulSync

## Infrastructure
- [ ] DB provisioned and migrated (`RUN_MIGRATIONS=true` once)
- [ ] Helm chart updated with prod values and secrets
- [ ] TLS certs valid (cert-manager/Ingress)

## Security
- [ ] Secrets in K8s Secret, not ConfigMap
- [ ] Audit logs enabled
- [ ] Rate limits on admin/docs/metrics/api
- [ ] Admin UI disabled in prod if not needed

## QA
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Contract & OpenAPI validation tests green
- [ ] Coverage ≥ 80%

## Monitoring
- [ ] Prometheus & Grafana dashboards up
- [ ] Alerts configured for SLOs
- [ ] Status page public, Kuma optional

## Legal
- [ ] Privacy Policy URL live
- [ ] GDPR/DPA docs ready
- [ ] Data retention doc published

## Store Submission
- [ ] App Store checklist complete
- [ ] Play Store checklist complete
- [ ] Reviewer credentials prepared

