#!/usr/bin/env bash
# Simple watchdog: checks /api/healthz and restarts services if unhealthy
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:8080}"
SERVICES="${SERVICES:-backend frontend}"
MAX_RETRIES="${MAX_RETRIES:-3}"
SLEEP_SEC="${SLEEP_SEC:-10}"
COOLDOWN_SEC="${COOLDOWN_SEC:-30}"

fail_count=0

check_once() {
  code=0
  body=""
  if command -v curl >/dev/null 2>&1; then
    body=$(curl -s -m 5 -w "%{http_code}" "$BASE_URL/api/healthz" || true)
    code="${body: -3}"
  else
    echo "curl not found"; return 1
  fi
  if [[ "$code" == "200" ]]; then
    echo "$(date -Is) OK healthz"
    return 0
  else
    echo "$(date -Is) FAIL healthz (code=$code)"
    return 1
  fi
}

while true; do
  if check_once; then
    fail_count=0
  else
    fail_count=$((fail_count+1))
    if [[ $fail_count -ge $MAX_RETRIES ]]; then
      echo "$(date -Is) Triggering restart for services: $SERVICES"
      restart_cmd(){ if docker compose version >/dev/null 2>&1; then docker compose -f "$(dirname "$0")/docker-compose.yml" restart $SERVICES; elif command -v docker-compose >/dev/null 2>&1; then docker-compose -f "$(dirname "$0")/docker-compose.yml" restart $SERVICES; else echo "docker compose not found"; fi }
      restart_cmd || true; echo "$(date -Is) Cooldown ${COOLDOWN_SEC}s"; sleep "$COOLDOWN_SEC"
      fail_count=0
    fi
  fi
  sleep "$SLEEP_SEC"
done
