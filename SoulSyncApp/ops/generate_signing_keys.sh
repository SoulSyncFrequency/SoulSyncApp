#!/usr/bin/env bash
set -euo pipefail
OUT="ops/grafana-cloud/signing"
mkdir -p "$OUT"
openssl genrsa -out "$OUT/private.pem" 2048
openssl rsa -in "$OUT/private.pem" -pubout -out "$OUT/public.pem"
echo "Keys generated in $OUT"
