# /ops/check-alerts (ops alerts)
- **POST /ops/check-alerts** — provjerava `anomaly-hints` metrike iz logova u zadanom prozoru (`?window=...`), i ako:
  - `errorRate > OPS_ALERT_THRESHOLD_ERRRATE` ili
  - `avgLatencyMs > OPS_ALERT_THRESHOLD_AVGMS`
  - i ako je prošao `OPS_ALERT_COOLDOWN_SEC` od zadnje notifikacije,
  - šalje poruku preko `notifyAll(...)` (Slack/Discord/Email, ovisno o ENV-u).
- Flag `OPS_ALERTS_ENABLED` mora biti `true`.
- Sigurno: **ne mijenja konfiguraciju**, samo obavještava.
