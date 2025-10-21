#!/bin/bash
set -e

echo "🚀 Starting intelligent Git push sequence..."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🔍 Active branch: $BRANCH"

echo "📦 Staging all changes..."
git add -A

# Default commit message ako nije naveden argument
if [ -z "$1" ]; then
  MSG="auto: sync + commit at $(date '+%Y-%m-%d %H:%M:%S')"
else
  MSG="$1"
fi

echo "🧾 Commit message: $MSG"
git commit -m "$MSG" || echo "ℹ️ No new changes to commit."

echo "⬆️ Attempting push to origin/$BRANCH..."
if git push origin "$BRANCH"; then
  echo "✅ Push successful!"
else
  echo "⚠️ Push rejected — attempting auto-rebase and sync..."
  git fetch origin "$BRANCH"
  git pull --rebase origin "$BRANCH" || git rebase --abort || true
  git push origin "$BRANCH" --force-with-lease
  echo "🔁 Auto-sync complete."
fi

echo "🎯 All done — repository is in perfect sync!"
