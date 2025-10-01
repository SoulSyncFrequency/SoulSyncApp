#!/bin/bash
set -euo pipefail
BASE="${1:-http://localhost:3000}"
echo "Smoke test against $BASE"
curl -fsS "$BASE/health" >/dev/null && echo "OK /health"
curl -fsS "$BASE/ready"  >/dev/null && echo "OK /ready"
curl -fsS "$BASE/ops/ping" >/dev/null && echo "OK /ops/ping"
curl -fsS "$BASE/ops/ping-db" -o /dev/null -w "DB %http_code\n" || true
curl -fsS "$BASE/ops/ping-redis" -o /dev/null -w "Redis %http_code\n" || true
curl -fsS "$BASE/ops/version" | jq . >/dev/null && echo "OK /ops/version"
curl -fsS "$BASE/ops/status?window=15m" | jq .anomalyHints >/dev/null && echo "OK /ops/status"
curl -fsS "$BASE/ops/slo-status?window=15m" | jq . >/dev/null && echo "OK /ops/slo-status"
echo "Smoke test finished"
