# Local Production-like Stack

## Start
```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build
```

## Services
- Backend: http://localhost:3000  
- Postgres: localhost:5432 (soulsync/soulsync)  
- Redis: localhost:6379  
- Prometheus: http://localhost:9090  
- Grafana: http://localhost:3002 (admin/admin by default)  
- Uptime Kuma: http://localhost:3001  

## Notes
- Backend health: `/healthz`, readiness: `/readyz`, metrics: `/metrics`
- Grafana dashboards auto-provisioned from `infra/monitoring/grafana/dashboards/`
- Prometheus scrapes `backend:3000/metrics`
- To run DB migrations on start set `RUN_MIGRATIONS=true` in `.env`
