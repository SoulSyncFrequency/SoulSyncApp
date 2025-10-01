#!/usr/bin/env bash
# One-time setup script for Ubuntu (installs Docker, Compose plugin, logs into GHCR if provided)
set -euo pipefail
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
sudo usermod -aG docker $USER || true
if ! docker compose version >/dev/null 2>&1; then
  DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
  mkdir -p "$DOCKER_CONFIG/cli-plugins"
  curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
  chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
fi
echo "Docker & Compose ready."
