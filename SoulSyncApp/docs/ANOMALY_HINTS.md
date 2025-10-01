# Anomaly hints (in /ops/status)
- Na osnovu zadnjih ~5000 linija `logs/access.ndjson` i prozora 15min računamo:
  - udio 5xx (`errRate`)
  - prosječnu latenciju
- Ako je 5xx > 5% → hint: *High 5xx rate*; ako je avg > 500ms → hint: *High avg latency*.
- Inače: *No anomalies detected...* (best-effort, ovisi o dostupnosti logova i timestamp polju).
