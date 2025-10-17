#!/bin/bash
set -euo pipefail
# Usage: ./scripts/pg-backup.sh output.sql
OUT=${1:-backup.sql}
PGURL=${POSTGRES_URL:-postgresql://soulsync:soulsync@localhost:5432/soulsync}
pg_dump "$PGURL" > "$OUT"
echo "Backup written to $OUT"
