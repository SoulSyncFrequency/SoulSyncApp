# v348 Enhancements
- Enforced adminAuth on `/admin` mounts (hash+scope+expiry scaffold is ready).
- Wired `httpFetch` (timeouts/retries) in push/webhook code where applicable.
- Prometheus histogram middleware + `/metrics` endpoint (latency p95/p99).
- Added `npm-audit` workflow; lint-staged config (+ Husky setup doc).
- Added simple CORS allowlist test.
