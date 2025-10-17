#!/bin/bash
set -euo pipefail
# Usage: ./scripts/pg-restore.sh input.sql
IN=${1:-backup.sql}
PGURL=${POSTGRES_URL:-postgresql://soulsync:soulsync@localhost:5432/soulsync}
psql "$PGURL" -f "$IN"
echo "Restore done from $IN"
