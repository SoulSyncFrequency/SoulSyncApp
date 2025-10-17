# SLO / SLI

## SLIs
- **Availability**: % of 2xx over total requests.
- **Latency (p95)**: HTTP request duration.
- **Error rate (5xx)**: rate of 5xx per minute.
- **Queue metrics**: DLQ purge count, queue depth.

## SLOs (initial)
- Availability ≥ 99.9% monthly.
- Latency p95 ≤ 250ms for `/healthz`, ≤ 500ms for typical `/api/*`.
- Error rate 5xx ≤ 0.1% sustained over 5 minutes.

## Alerts
- High 5xx → warning at 0.1% for 5m, critical at 1% for 5m.
- Readiness failing → critical after 2m.
