# /ops/metrics/export
- Čita `logs/access.ndjson` (posljednjih ~20k linija) i vraća agregaciju per-route: `count, avgMs, p95Ms, p99Ms`.
- Parametri: `?path=...` (relativno na project root) i `?format=json|csv` (default json).
- Korisno za brz uvid ili CSV export za dublju analizu.
