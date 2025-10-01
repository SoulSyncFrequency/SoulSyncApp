# v347 Hardening
- JWT fail-fast in production (no 'dev_secret' fallback).
- Idempotency-Key middleware (Redis) for export/pdf routes.
- Backpressure added to export/pdf routes (besides therapy).
- Redis sliding-window limiter on therapy+export routes.
- HTTP client wrapper with timeout/retries.
- ENV example updated with CORS allowlist, Redis, JWT_SECRET.
