# SoulSync Runbook (Incident Response)

## HighErrorRate
1. Open Grafana → Dashboard *SoulSync Backend* → panels: Request rate by status, p95 by route.
2. Check logs around spike (filter by `x-request-id`). Verify recent deploy / migrations.
3. Rollback last release if error coincides with deploy.
4. If specific route is failing, enable debug logs for that module, check DB/redis connectivity.
5. Communicate status in #on-call channel, create incident ticket.

## HighLatencyP95
1. Validate DB slow queries (check APM or DB dashboard), look for lock contention.
2. Inspect worker backlog and CPU/memory for pods.
3. Scale replicas (HPA) and/or increase DB pool size (temporarily).

## QueueBacklogHigh
1. Inspect `/ops/queues` (read-only) → which queue is backlogged?
2. Check worker pods health; scale workers up; verify Redis connectivity and job durations.
3. If caused by a spike, consider temporary rate limiting or circuit breakers.
4. If jobs are failing repeatedly, inspect failures and fix root cause.

## Common Checks
- `/livez` and `/readyz` status.
- Recent config/env changes.
- External dependencies (email/SMS/3rd party APIs).

## Rollback Procedure
- Trigger Helm rollback: `helm rollback soulsync <REV>`
- Verify health: `/healthz`, Grafana, logs.
