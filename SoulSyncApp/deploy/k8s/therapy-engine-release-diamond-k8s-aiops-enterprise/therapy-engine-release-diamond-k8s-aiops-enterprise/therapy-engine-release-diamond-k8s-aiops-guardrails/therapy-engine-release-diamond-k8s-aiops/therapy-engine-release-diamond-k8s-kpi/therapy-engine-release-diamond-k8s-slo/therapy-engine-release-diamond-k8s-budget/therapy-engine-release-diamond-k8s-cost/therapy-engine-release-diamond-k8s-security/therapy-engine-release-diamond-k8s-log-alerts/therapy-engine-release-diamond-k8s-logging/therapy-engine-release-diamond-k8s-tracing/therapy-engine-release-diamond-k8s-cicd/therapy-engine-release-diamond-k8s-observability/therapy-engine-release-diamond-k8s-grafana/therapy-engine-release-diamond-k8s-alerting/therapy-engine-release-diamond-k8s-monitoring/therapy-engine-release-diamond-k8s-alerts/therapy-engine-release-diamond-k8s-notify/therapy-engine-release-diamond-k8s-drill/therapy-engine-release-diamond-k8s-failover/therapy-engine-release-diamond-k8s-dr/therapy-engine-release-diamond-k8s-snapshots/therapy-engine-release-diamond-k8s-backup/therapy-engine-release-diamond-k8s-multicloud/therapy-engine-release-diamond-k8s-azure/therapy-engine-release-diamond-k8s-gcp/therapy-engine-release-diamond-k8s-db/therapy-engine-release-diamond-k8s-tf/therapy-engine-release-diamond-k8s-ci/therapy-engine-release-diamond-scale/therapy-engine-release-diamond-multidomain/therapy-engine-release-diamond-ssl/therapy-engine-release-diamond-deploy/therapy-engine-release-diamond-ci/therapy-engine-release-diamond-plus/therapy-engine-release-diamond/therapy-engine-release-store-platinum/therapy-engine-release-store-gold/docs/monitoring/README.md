# Monitoring (Prometheus + Grafana)

## Install (Kubernetes)
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

helm upgrade --install prometheus prometheus-community/prometheus -f ops/monitoring/prometheus-values.yaml
helm upgrade --install grafana grafana/grafana -f ops/monitoring/grafana-values.yaml
```
Login Grafana: `admin / admin123` (change in `grafana-values.yaml`).

## Backend Metrics
- Exposes `/metrics` (Prometheus format)
- Custom metric: `last_successful_drill_timestamp_seconds`

The Helm Service has Prometheus annotations to auto-scrape.

## DR Drill metric
Workflow `dr-drill.yml` calls `POST $DR_API_URL/metrics/drill-success` on success.
Set `DR_API_URL` in GitHub Secrets to your public API (e.g. `https://api.mojadomena.com`).

## Dashboards
- `ops/monitoring/dashboards/therapy-drill.json`
- Included inline in `grafana-values.yaml` under `dashboards.default.therapy-drill`.
