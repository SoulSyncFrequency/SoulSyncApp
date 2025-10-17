#!/bin/bash
set -euo pipefail
: "${POSTGRES_URL:?Need POSTGRES_URL}"
mkdir -p backups
ts=$(date +%Y%m%d_%H%M%S)
pg_dump "$POSTGRES_URL" | gzip > "backups/db_$ts.sql.gz"
echo "Backup written to backups/db_$ts.sql.gz"
