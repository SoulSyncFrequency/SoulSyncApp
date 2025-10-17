# OpenAPI workflow
1) Author fragments under `backend/openapi/fragments/*.json`.
2) Merge into `backend/openapi/openapi.json` (script already merges during build here).
3) Contract tests use `openapi/openapi.json` and AJV to validate example responses.
4) CI job `openapi-freshness` ensures spec is committed after generation.
