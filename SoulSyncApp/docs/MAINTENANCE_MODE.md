# Maintenance Mode
- Set `MAINTENANCE_MODE=true` to return `503 { error:'maintenance', retryAfter:60 }` for most endpoints.
- Allowed endpoints: `/health`, `/live`, `/ready`, `/metrics`, `/version`, `/openapi.json`, `/csp-report`.
- Clients should obey `Retry-After`.
