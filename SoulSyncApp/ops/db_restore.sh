#!/bin/bash
set -euo pipefail
: "${POSTGRES_URL:?Need POSTGRES_URL}"
file="$1"
if [ ! -f "$file" ]; then echo "File not found: $file"; exit 1; fi
gunzip -c "$file" | psql "$POSTGRES_URL"
