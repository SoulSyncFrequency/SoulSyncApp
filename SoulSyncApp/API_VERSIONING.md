# API Versioning

- Current version: v1 (`/api/v1/*`)
- Env var `API_VERSION` controls default version.
- `/api/*` should redirect or proxy to `/api/v1/*` for backward compatibility.
