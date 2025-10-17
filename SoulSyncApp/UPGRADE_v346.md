
# Upgrade integrated (v346)
- Added ApiKey tiering (FREE/STARTER/PRO/ENTERPRISE) + rpm/dailyCap/expiresAt/scopes
- Added per-key rate limiter and global backpressure to therapy pipeline
- Added admin auth hardening scaffold
- Added anomaly batch scanner + CI workflows (OpenAPI freshness, anomaly schedule)
- Added k6 load test, Dockerfile (hardened), Render blueprint, OTEL bootstrap, Postman
- Added .env example for tiers/backpressure
