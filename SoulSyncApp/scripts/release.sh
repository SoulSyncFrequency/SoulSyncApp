#!/bin/bash
set -euo pipefail

VERSION=${1:-1.0.0}

echo "==> Building and testing"
npm ci && npm run build --workspace=backend
npm run test:all --workspace=backend

echo "==> Generating OpenAPI YAML"
npm run openapi:gen --workspace=backend || true
npm run openapi:yaml --workspace=backend || true

echo "==> Building Docker image ghcr.io/<org>/soulsync-backend:$VERSION"
docker build -t ghcr.io/<org>/soulsync-backend:$VERSION ./backend

echo "==> Pushing Docker image"
docker push ghcr.io/<org>/soulsync-backend:$VERSION

echo "==> Helm upgrade"
helm upgrade --install soulsync charts/soulsync -f charts/soulsync/values-production.yaml --set image.tag=$VERSION

echo "==> Tagging git and pushing"
git tag v$VERSION
git push --tags

echo "Release $VERSION complete."
