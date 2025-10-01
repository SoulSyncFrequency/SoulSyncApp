# CI Hints
- Run `node tests/openapi-check.js` to verify OpenAPI paths are mounted.
- Add `js-yaml` dev dependency for the check.
- Optional: add supertest to hit /healthz, /readyz, /livez after boot.
