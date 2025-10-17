# Metrics & Prometheus

- `/metrics` endpoint is exposed by the backend.
- Per-route histogram is enabled via `middleware/metricsRouteHistogram.ts`.
- Override default buckets with env:
  - `METRICS_HTTP_BUCKETS="0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10"`
- Example to run local stack:
  ```bash
  make infra-up
  make metrics  # verify
  make grafana-open
  ```

## Extended Metrics

- **p95 / p99 latency**: shows near-tail performance of endpoints.
- **Error rate**: proportion of 5xx responses vs all requests.
- **Redis FT.SEARCH QPS**: number of RediSearch queries per second.

PromQL examples:
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le,route))
sum(rate(http_requests_total{status_code=~"5.."}[1m])) / sum(rate(http_requests_total[1m]))
sum(rate(redis_commands_total{command="ft.search"}[1m]))
```

## SLO & Error Budget
- Grafana dashboard `slo-error-budget.json` prikazuje availability, 5xx error rate i p95 latency.
- Preporuka: definiraj cilj (npr. 99.9% availability, p95 < 1s).

## Alerting
- Prometheus `rules.yml` sadrži osnovne alarme za error rate i p95 latenciju.
- Alertmanager servis je uključen u `docker-compose.yml` (koristi `observability/alertmanager.yml`).
