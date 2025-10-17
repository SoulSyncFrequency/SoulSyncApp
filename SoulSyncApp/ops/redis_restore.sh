#!/bin/bash
set -euo pipefail
file="$1"
if [ ! -f "$file" ]; then echo "File not found: $file"; exit 1; fi
cp "$file" dump.rdb
echo "Place dump.rdb in Redis dir and restart Redis server."
