# Operations Endpoints
- `GET /live` — liveness (always 200 when process is up).
- `GET /ready` — readiness (200 only ako DB radi; inače 503 `db_unavailable`).
- `GET /openapi.json` — vraća trenutni OpenAPI spec ako postoji na disku.
