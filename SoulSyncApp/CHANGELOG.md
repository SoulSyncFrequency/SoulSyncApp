# Changelog

## v365 → v380
- Added security hardening (CSP enforce, HSTS, COOP/COEP optional, nosniff, X-Frame-Options).
- Added detailed ops endpoints: /ops/status, /ops/config-diff, /ops/flags, /ops/heatmap.
- Added hash + cache headers for /openapi.json and /openapi.hash endpoint.
- Added multiple health checks: /ops/ping, /ops/ping-db, /ops/ping-redis, /ops/ping-smtp, /ops/ping-s3.
- Added admin ops maintenance routes (log retention, CSP analyze).
- Added Sentry context tags and X-Request-Id generation/echo.
- Added Progest-E and Pregnenolone supplement modules, with clinician gating and summaries.
- Added response snapshot tests for critical endpoints and health routes.
- Added robots.txt, security.txt, and CI weekly-maintenance workflow.
- Added export formats (NDJSON/CSV) and RCA daily reports with TL;DR.
