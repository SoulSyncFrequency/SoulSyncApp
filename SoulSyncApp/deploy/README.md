# Deployment & Ops

This folder contains artifacts imported from prior SoulSync builds (k8s, Helm, monitoring). They are namespaced under subfolders by their source ZIP.
**Review and adapt** values/secrets before use. No secrets are committed.

- `deploy/k8s/*` — Kubernetes manifests/Helm chart snippets
- `infra/monitoring/*` — Prometheus/Grafana dashboards
- `legal/imported/*` — Imported legal docs for reference
- `addons/billing/*` — Billing/paywall examples
- `addons/optimizations/*` — Build/runtime optimization samples
