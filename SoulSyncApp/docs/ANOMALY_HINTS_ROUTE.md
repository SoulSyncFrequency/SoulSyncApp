# /ops/anomaly-hints
- Vraća `errorRate`, `avgLatencyMs` i `hints[]` za zadnjih ~15 minuta (best-effort iz `logs/access.ndjson`).
- Isto kao `anomalyHints` u /ops/status, ali zasebna ruta za brzi polling.
