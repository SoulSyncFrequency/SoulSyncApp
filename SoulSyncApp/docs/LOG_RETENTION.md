# Log Retention
- `backend/scripts/log_retention.py` deletes `logs/*.ndjson` and `logs/*.gz` older than `LOG_RETENTION_DAYS` (default 30).
- Schedule via cron/CI per okruženju.
