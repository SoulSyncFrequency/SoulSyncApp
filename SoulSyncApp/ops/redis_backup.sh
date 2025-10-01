#!/bin/bash
set -euo pipefail
: "${REDIS_URL:?Need REDIS_URL}"
mkdir -p backups
ts=$(date +%Y%m%d_%H%M%S)
# assuming local redis-cli with configured URL
redis-cli -u "$REDIS_URL" SAVE
cp dump.rdb "backups/redis_$ts.rdb"
echo "Redis dump copied to backups/redis_$ts.rdb"
