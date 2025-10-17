#!/usr/bin/env bash
set -euo pipefail
FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "Usage: $0 ops/backups/config-YYYYMMDD-HHMMSS.tar.gz"
  exit 1
fi
tar -xzf "$FILE" -C /
echo "Restored from $FILE"
