# Data Retention Policy (Placeholder)

- **Logs**: rotate daily, retain 30 days (configurable via `LOG_TTL_DAYS`).
- **Metrics**: Prometheus retention per environment (e.g., 15–30 days).
- **User content**: only stored if necessary for functionality; default is ephemeral.
- **Backups**: if DB is used, define backup frequency and retention here.
