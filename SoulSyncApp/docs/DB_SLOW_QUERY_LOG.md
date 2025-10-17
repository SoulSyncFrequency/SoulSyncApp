# DB Slow Query Log
- Set `DB_SLOW_MS` (default 200ms). Queries above threshold are logged to `logs/db_slow.ndjson`.
- Redacts to max ~2k chars to avoid log bloat.
