# Uptime Kuma – SoulSync Monitoring Skeleton

## Quickstart
```bash
cd uptime-kuma
docker compose up -d
```

## Access
Visit http://localhost:3001 (default admin setup wizard).

## Suggested Monitors
- https://soulsync.example.com/healthz (HTTP keyword: ok)
- https://soulsync.example.com/readyz (HTTP 200)
- https://soulsync.example.com/metrics (HTTP 200)
- Redis (ping) if exposed internally
- PostgreSQL (connection check) if applicable

## Notes
- This is optional – for real-time monitoring and incident dashboard.
- For App Store/Play Store, use the static HTML status page (`/status/index.html`).
