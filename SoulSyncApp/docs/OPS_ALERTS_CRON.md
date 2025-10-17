# ops-alerts-cron (GitHub Actions)
- Svakih **5 minuta** zove `POST /ops/check-alerts` s headerom `X-OPS-TOKEN` (ako je postavljen `OPS_ALERT_TOKEN`).
- Potrebni `secrets` u GitHubu:
  - `ALERT_ENDPOINT_URL` (npr. `https://api.yourdomain.com/ops/check-alerts?window=15m`)
  - `OPS_ALERT_TOKEN` (isto kao u server ENV-u).
