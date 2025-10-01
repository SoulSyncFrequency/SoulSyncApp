# Sentry Context Tags
- Middleware `sentryContext()` dodaje tagove `route`, `user` (hash), `plan` (hash) i opcionalno `tier` iz `x-plan-tier` headera.
- Pomaže u triaži i filterima bez curenja PII.
