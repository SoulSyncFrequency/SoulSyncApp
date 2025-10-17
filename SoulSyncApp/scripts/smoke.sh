#!/bin/bash
set -euo pipefail
BASE_URL=${1:-http://localhost:3000}
echo "Smoke testing $BASE_URL"
curl -fsSL "$BASE_URL/healthz" >/dev/null
curl -fsSL "$BASE_URL/readyz"  >/dev/null
curl -fsSL "$BASE_URL/metrics" >/dev/null
echo "OK"
