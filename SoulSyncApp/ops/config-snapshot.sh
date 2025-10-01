#!/usr/bin/env bash
set -euo pipefail
TS=$(date +"%Y%m%d-%H%M%S")
OUT="ops/backups/config-$TS.tar.gz"
tar -czf "$OUT"   ops/.env.backend   ops/grafana-datasources/datasource.yml   ops/grafana-dashboards/   ops/grafana-alerts/   || { echo "Some files missing; snapshot may be partial."; }
echo "Snapshot saved to $OUT"
