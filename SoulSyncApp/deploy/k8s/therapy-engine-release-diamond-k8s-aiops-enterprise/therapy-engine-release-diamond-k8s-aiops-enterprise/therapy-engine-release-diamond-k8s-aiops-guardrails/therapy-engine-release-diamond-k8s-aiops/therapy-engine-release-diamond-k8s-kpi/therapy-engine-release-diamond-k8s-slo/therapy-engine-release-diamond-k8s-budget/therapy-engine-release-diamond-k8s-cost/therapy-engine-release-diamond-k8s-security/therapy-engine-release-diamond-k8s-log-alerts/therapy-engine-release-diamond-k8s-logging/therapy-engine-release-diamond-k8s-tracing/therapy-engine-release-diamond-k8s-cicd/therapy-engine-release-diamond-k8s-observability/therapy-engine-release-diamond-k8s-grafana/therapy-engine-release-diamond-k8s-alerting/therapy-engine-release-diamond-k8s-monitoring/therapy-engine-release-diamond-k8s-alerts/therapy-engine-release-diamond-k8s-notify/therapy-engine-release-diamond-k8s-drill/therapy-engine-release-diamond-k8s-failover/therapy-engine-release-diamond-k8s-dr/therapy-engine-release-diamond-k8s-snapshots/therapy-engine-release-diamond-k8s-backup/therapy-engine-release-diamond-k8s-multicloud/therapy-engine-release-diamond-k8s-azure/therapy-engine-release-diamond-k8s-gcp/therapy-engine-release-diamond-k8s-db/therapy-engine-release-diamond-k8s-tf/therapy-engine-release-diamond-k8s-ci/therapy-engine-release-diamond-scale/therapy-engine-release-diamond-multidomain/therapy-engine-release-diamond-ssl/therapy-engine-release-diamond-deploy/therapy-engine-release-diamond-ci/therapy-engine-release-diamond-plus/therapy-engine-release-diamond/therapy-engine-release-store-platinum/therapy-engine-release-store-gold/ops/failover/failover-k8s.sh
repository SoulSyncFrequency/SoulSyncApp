#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <NEW_DATABASE_URL>"
  exit 1
fi

DBURL="$1"

echo "Patching Kubernetes secret therapy-backend-secrets ..."
kubectl patch secret therapy-backend-secrets -p "{"stringData":{"DATABASE_URL":"${DBURL}"}}"

echo "Rolling restart backend deployment ..."
kubectl rollout restart deployment/therapy-engine-backend || true

echo "Helm upgrade to ensure sync ..."
helm upgrade --install therapy ops/helm/therapy-engine -f ops/helm/therapy-engine/values.yaml

echo "Done."
