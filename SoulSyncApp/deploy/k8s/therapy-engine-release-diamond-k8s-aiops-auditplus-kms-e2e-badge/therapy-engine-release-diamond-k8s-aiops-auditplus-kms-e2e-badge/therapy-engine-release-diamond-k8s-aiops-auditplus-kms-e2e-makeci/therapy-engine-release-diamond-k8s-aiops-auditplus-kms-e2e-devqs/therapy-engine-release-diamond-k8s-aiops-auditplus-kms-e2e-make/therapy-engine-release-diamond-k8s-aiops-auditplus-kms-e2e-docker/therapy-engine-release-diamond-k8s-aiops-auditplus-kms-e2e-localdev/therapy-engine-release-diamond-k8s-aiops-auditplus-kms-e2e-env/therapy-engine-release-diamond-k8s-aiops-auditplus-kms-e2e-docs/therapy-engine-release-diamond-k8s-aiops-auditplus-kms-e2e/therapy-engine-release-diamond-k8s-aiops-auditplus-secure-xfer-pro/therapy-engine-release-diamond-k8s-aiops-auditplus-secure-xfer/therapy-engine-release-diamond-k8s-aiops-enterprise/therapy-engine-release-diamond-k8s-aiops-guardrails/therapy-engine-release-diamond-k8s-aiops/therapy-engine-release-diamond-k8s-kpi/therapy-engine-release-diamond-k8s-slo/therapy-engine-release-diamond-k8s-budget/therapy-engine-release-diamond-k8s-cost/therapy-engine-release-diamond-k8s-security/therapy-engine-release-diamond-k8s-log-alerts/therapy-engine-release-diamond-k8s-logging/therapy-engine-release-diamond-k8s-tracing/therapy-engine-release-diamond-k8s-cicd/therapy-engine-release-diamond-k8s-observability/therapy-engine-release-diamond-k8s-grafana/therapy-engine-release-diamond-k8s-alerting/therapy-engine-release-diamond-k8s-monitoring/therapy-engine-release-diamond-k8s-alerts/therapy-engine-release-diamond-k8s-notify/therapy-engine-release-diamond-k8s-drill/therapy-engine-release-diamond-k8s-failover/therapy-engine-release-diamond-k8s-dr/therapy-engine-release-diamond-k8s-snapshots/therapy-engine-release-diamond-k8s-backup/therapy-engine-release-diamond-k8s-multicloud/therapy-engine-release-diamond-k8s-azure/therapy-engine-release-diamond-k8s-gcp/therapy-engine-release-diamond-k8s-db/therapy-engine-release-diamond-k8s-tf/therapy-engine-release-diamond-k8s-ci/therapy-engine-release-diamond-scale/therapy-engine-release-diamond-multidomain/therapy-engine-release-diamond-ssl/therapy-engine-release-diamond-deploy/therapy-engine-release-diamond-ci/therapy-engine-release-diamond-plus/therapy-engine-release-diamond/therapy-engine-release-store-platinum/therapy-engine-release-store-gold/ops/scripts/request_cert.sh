#!/usr/bin/env bash
# Usage: DOMAIN=example.com EMAIL=you@example.com ./ops/scripts/request_cert.sh
set -euo pipefail
if [ -z "${DOMAIN:-}" ] || [ -z "${EMAIL:-}" ]; then
  echo "Set DOMAIN and EMAIL env vars"; exit 1
fi
docker compose -f docker-compose.prod.ssl.yml run --rm certbot certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email
echo "Update ops/nginx/nginx.ssl.conf -> replace YOUR_DOMAIN with $DOMAIN, then restart proxy: docker compose -f docker-compose.prod.ssl.yml up -d --build proxy"
