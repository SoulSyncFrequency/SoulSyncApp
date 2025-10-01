# Observability
- `docker compose -f docker-compose.observability.yml up` pokreće Prometheus (9090) i Grafanu (3001).
- Prometheus zove lokalni backend na `http://localhost:3000/metrics` (mapirano kao host.docker.internal).
- U Grafani dodaj Prometheus datasource na `http://prometheus:9090` i nacrtaj grafove (heap, requests, uptime).
