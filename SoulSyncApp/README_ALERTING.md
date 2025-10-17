# SoulSync Alerting — Production Kit (v100.0.0)

This document describes the end‑to‑end alerting stack: real‑time notifications, email/webhook alerting with HMAC, logs & retries, dashboard analytics, archives/retention, and PDF exports.

## Table of Contents
- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Environment Setup](#environment-setup)
- [Health & Selfcheck](#health--selfcheck)
- [Preflight](#preflight)
- [API Route Reference](#api-route-reference)
  - [Email Reports](#email-reports)
  - [Webhooks](#webhooks)
  - [Notifications](#notifications)
  - [Dashboard](#dashboard)
  - [Health & Sanity](#health--sanity)
- [Troubleshooting](#troubleshooting)

## Overview
- Real‑time SSE toasts & click‑through
- Critical sound alerts
- Filters, search, export, pin, critical‑only
- Pagination + daily stats + charts
- Retention & CSV archives (+ admin UI to download)
- Daily email report (hybrid: summary of all + details for critical)
- Webhook API with HMAC SHA‑256 signatures + retry cron
- Audit logs for all outgoing emails & webhooks
- Admin dashboard (counters, top types/users, live feed, trends, watchdog w/ reset)
- PDF export (dashboard & docs), weekly email with PDF

## Architecture Diagram
```
            ┌──────────────┐
            │ Notifications│
            └──────┬───────┘
                   │
         ┌─────────┴───────────┐
         │                     │
   ┌─────▼─────┐         ┌─────▼──────┐
   │ Email cron│         │ Webhooks   │
   │ (daily)   │         │ (real-time)│
   └─────┬─────┘         └─────┬──────┘
         │                     │
   ┌─────▼─────┐         ┌─────▼──────┐
   │ EmailLog  │         │ WebhookLog │
   └─────┬─────┘         └─────┬──────┘
         │                     │
         └─────────┬───────────┘
                   │
             ┌─────▼───────┐
             │ Retry cron  │
             └─────┬───────┘
                   │
           ┌───────▼──────────────────┐
           │ Admin Dashboard          │
           │ - Stats / Graphs         │
           │ - Logs & Retry           │
           │ - Watchdog / Reset       │
           │ - PDF export + weekly    │
           └──────────────────────────┘
```

## Environment Setup
Install dependencies (plus optional pdfkit for PDF exports):
```bash
npm i pdfkit
```
Configure `.env` (backend):
```env
EMAIL_FROM="SoulSync <no-reply@soulsync.app>"
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
DAILY_REPORT_HOUR=8
DEFAULT_WEBHOOK_SECRET=changeme
FRONTEND_ORIGIN=http://localhost:5173
NOTIFICATIONS_RETENTION_DAYS=180
NOTIF_ARCHIVE_MODE=all
```
Run Prisma:
```bash
cd backend
npx prisma generate
npx prisma migrate dev -n v100_alerting
```

## Health & Selfcheck
- `GET /api/healthz` — quick status of API & DB
- `GET /api/admin/selfcheck` — checks Prisma, core tables, and required env vars

## Preflight
Run before deploy to verify environment & DB:
```bash
npx ts-node scripts/preflight.ts
```

## API Route Reference

### Email Reports
- `POST /api/reports/daily/send-now` → `{ "ok": true }`
- (cron) daily email at `DAILY_REPORT_HOUR`
- (cron) weekly dashboard email (Monday)

### Webhooks
- `GET /api/webhooks` → `{ "items":[ { "id":1, "url":"https://...", "active":true, "createdAt":"..." } ] }`
- `POST /api/webhooks` (body: `{url,secret}`)
- `DELETE /api/webhooks/:id`
- `POST /api/webhooks/:id/toggle`
- `POST /api/webhooks/:id/test`
- `GET /api/webhooks/logs?status=&days=&search=` → `{ "items":[ { "id":12,"status":"FAILED","attempts":3,"sentAt":"..."} ] }`
- `POST /api/webhooks/logs/:id/retry` → `{ "ok": true }`

### Notifications
- `GET /api/notifications?type=&unread=&days=&search=`
- `GET /api/notifications/paged?page=&pageSize=&...`
- `GET /api/notifications/stats`
- `GET /api/notifications/daily?days=30`
- `GET /api/notifications/archives`
- `GET /api/notifications/archives/:file`

### Dashboard
- `GET /api/admin/dashboard` → counters + deltas + top lists
- `GET /api/admin/dashboard/export-pdf` → PDF download (requires `pdfkit`)
- `GET /api/admin/watchdog-status`
- `PUT /api/admin/modules/:id/reset-fails`

### Health & Sanity
- `GET /api/healthz` → `{ "ok": true, "db": true, "time": "..." }`
- `GET /api/admin/selfcheck` → `{ prisma:true, tables:{...}, env:{...} }`

## Troubleshooting
- **PDF export returns 501** → install `pdfkit` in backend.
- **Emails failing** → check SMTP_* env vars and `EmailLog`.
- **Webhooks failing** → check endpoint URL, secret, and server logs; use `WebhookLog` + Retry.
- **No archives** → wait for pruning cron or reduce `NOTIFICATIONS_RETENTION_DAYS` in `.env`.

### New environment keys (v100.0.2)
```
WEBHOOK_ALLOWLIST=hooks.slack.com,*.yourdomain.com
WEBHOOK_TIMEOUT_MS=5000
ADMIN_API_TOKEN=changeme-admin
```

- `WEBHOOK_ALLOWLIST`: comma-separated domains; supports `*.example.com` wildcard.
- `WEBHOOK_TIMEOUT_MS`: fetch timeout for webhook POST.
- `ADMIN_API_TOKEN`: fallback header `x-admin-token` for admin API.


### Observability & Queues (v100.0.3)
```
# Prometheus metrics
# scrape /api/metrics

# Redis for BullMQ queues
REDIS_URL=redis://localhost:6379
EMAIL_CONCURRENCY=3
WEBHOOK_CONCURRENCY=5

# Rate limits per minute
RATE_LIMIT_PDF=10
RATE_LIMIT_TEST=10
RATE_LIMIT_REPORT=5
```


### SLO & Logs (v100.0.4)
```
# Protect /api/metrics
METRICS_TOKEN=changeme-metrics

# SLO alerts (hourly)
SLO_FAIL_THRESHOLD=0.3
SLO_ALERT_WEBHOOK=
```
- `SystemLog` (DB) — structured log sink s indexima
- Admin UI: `/admin/system-logs`


### v100.0.5 Enterprise Hardening
```
# Metrics Basic Auth (optional)
METRICS_BASIC_USER=metrics
METRICS_BASIC_PASS=secret

# Logs to file (optional)
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/app.log

# Optional SLO webhook alerts
SLO_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```
- `/api/metrics` sada prihvaća i Basic Auth (pored x-metrics-token i lokalne IP).
- **SLOConfig** (DB) + UI `/admin/slo-config` za promjenu pragova i webhook URL‑a.
- **Log download**: `/api/admin/logfiles/current` (+ link u navigaciji "⬇️ Logs").
- **Email idempotency**: queue jobId = `to:subject`.
- Playwright E2E skeleton u `tests/e2e/`.
