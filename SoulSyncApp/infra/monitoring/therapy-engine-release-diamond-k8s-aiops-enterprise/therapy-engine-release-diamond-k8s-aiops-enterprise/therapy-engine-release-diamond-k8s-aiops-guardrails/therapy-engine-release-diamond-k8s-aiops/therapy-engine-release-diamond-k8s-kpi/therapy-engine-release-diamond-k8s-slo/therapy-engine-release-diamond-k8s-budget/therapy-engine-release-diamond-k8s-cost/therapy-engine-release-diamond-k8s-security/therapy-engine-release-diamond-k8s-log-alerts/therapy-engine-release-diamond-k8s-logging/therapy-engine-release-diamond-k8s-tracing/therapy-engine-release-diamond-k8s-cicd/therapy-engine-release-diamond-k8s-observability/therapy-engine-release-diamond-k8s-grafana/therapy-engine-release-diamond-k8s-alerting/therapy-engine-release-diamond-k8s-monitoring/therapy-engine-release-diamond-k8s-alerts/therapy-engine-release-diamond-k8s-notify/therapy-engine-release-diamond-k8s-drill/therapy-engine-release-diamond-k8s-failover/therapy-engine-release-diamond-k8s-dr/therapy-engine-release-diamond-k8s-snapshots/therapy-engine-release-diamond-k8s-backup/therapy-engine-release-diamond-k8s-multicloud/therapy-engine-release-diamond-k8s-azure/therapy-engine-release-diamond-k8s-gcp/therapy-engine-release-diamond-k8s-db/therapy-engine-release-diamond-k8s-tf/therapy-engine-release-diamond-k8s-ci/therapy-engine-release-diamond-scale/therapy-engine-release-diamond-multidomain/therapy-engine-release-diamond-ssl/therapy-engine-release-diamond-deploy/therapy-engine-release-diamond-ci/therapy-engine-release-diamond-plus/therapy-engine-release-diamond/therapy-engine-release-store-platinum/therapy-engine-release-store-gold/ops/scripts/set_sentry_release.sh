#!/usr/bin/env bash
set -euo pipefail
REV=${GITHUB_SHA:-$(git rev-parse --short HEAD)}
export SENTRY_RELEASE=$REV
export VITE_SENTRY_RELEASE=$REV
printenv | grep -E 'SENTRY_RELEASE|VITE_SENTRY_RELEASE'
