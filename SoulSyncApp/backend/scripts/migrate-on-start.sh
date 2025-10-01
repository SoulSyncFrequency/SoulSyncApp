#!/bin/bash
set -euo pipefail
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "==> Running prisma migrate deploy"
  npx prisma migrate deploy
else
  echo "RUN_MIGRATIONS not true, skipping auto-migrate"
fi
