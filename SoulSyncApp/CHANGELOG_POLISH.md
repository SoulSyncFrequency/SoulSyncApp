# Polish Changes (v101.5.34_ultra28)
- Removed duplicate ESLint/Prettier configs (keep .eslintrc.cjs and .prettierrc)
- Consolidated Capacitor to `mobile/`
- Fixed `frontend/vite.config.ts` integrity + enabled sourcemaps
- Added iOS privacy usage strings to Info.plist
- Added per-service Dockerfiles + suggested Render config
- Gated `/metrics` with optional METRICS_TOKEN
- Guarded `/admin/diagnostics` behind basic auth in server
- Bumped package versions to 101.5.34
- Added npm workspaces and root scripts (lint/typecheck/build/test)
