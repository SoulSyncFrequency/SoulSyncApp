# Render – Step-by-step

1. Create a Web Service → Node.
2. Connect repository and select **root** (monorepo) – set build/start commands:
   - Build Command: `npm ci && npm run build --workspace=backend`
   - Start Command: `npm run start:prod --workspace=backend`
3. Region: Frankfurt (EU) / closest to users.
4. Add Env Vars:
   - `NODE_ENV=production`
   - `REDIS_URL=...`
   - `ADMIN_TOKENS=ops:REDACTED`
   - `ADMIN_PURGE_ENABLED=true`
   - `ADMIN_UI_ENABLED=false`
   - `METRICS_TOKEN=REDACTED`
5. Deploy → verify `/healthz`, `/readyz`, `/metrics`.
6. Optionally add a **Private Service** for Redis or use hosted Redis.
