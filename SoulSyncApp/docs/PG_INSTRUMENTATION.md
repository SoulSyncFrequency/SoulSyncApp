# PG instrumentation (opt-in)
- `wrapPgPool(pgPool)` iz `src/services/pgInstrumentation.ts` — omota `pool.query` i zapisuje spore/failed upite u `logs/sql_slow.ndjson`.
- ENV:
  - `PG_INSTRUMENT_ENABLED=true`
  - `SLOW_QUERY_MS=300` (prag u ms)
- Nije auto-uključeno; uključite samo ako imate `pg` i želite minimalni tracing.
