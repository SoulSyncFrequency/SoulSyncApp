#!/usr/bin/env bash
# Pull & restart stack with compose (expects to be run from repo root on server)
set -euo pipefail
export COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.ssl.yml}
git fetch origin main
git reset --hard origin/main
docker compose -f $COMPOSE_FILE pull || true
docker compose -f $COMPOSE_FILE up -d --build
docker system prune -f
