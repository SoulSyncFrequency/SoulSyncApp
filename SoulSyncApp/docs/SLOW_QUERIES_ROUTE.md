# /ops/slow-queries
- Čita `logs/sql_slow.ndjson` i agregira po fingerprintu SQL-a (sha1).
- Vraća top ~50 po `maxMs` s `avgMs`, `count`, `lastTs` i sample textom.
