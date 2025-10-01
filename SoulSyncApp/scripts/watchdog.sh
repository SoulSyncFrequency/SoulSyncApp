#!/usr/bin/env bash
set -euo pipefail
SERVICES=("loki" "tempo" "promtail")
for s in "${SERVICES[@]}"; do
  if ! docker ps --format '{{.Names}}' | grep -q "$s"; then
    echo "Service $s not running, starting..."
    docker-compose -f docker-compose.override.yml up -d $s || true
  fi
done
