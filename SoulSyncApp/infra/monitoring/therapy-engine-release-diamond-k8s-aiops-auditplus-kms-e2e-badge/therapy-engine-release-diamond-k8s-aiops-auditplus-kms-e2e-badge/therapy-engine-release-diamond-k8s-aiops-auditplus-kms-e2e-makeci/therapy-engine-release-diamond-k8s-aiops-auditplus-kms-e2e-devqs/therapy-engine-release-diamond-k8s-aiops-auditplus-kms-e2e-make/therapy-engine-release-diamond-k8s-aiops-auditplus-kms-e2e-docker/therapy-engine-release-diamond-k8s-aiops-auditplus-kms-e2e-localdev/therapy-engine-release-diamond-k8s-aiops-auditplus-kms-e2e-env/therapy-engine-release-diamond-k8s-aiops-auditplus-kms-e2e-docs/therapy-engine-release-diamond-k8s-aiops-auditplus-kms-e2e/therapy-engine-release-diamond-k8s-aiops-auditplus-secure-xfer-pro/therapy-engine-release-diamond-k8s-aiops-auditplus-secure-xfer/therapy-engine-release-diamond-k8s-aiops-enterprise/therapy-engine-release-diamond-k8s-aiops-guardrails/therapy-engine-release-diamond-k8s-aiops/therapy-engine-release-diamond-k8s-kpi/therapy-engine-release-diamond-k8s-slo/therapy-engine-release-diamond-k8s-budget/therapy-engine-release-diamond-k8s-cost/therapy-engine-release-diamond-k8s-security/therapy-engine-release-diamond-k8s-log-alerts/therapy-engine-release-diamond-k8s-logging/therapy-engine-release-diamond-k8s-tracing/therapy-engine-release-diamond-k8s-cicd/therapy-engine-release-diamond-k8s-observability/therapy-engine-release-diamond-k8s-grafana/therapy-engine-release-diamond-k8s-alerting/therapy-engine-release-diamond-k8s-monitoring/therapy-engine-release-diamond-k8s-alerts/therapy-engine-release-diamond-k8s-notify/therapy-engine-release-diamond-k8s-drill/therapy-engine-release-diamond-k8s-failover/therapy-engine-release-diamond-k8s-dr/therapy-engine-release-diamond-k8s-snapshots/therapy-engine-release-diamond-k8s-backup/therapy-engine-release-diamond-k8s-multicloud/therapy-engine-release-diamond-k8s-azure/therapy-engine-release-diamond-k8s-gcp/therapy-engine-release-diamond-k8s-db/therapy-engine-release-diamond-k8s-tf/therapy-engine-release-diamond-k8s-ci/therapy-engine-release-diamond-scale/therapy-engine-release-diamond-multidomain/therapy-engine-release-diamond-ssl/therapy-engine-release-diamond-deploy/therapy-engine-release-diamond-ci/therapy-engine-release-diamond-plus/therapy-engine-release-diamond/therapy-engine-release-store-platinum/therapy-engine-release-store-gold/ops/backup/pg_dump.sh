#!/usr/bin/env bash
# Usage: ./ops/backup/pg_dump.sh postgres://app:app@localhost:5432/therapy
set -euo pipefail
CONN="${1:-}"
if [ -z "$CONN" ]; then echo "Provide connection string"; exit 1; fi
mkdir -p backups
ts=$(date +%Y%m%d_%H%M%S)
pg_dump "$CONN" > "backups/therapy_$ts.sql"
echo "Backup saved to backups/therapy_$ts.sql"
