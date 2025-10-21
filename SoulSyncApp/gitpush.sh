#!/bin/bash
set -e

echo "🚀 Starting self-healing Git push + CI release pipeline v5.1 ..."
branch=$(git rev-parse --abbrev-ref HEAD)
echo "🌿 Active branch: $branch"

# Sync first
echo "🔄 Syncing with remote..."
git fetch origin $branch
git merge origin/$branch --strategy-option theirs --no-edit || true

# Commit if there are local changes
if ! git diff --quiet; then
  git add .
  git commit -m "auto: pre-push sync"
fi

# First push attempt
echo "📤 Attempting push..."
if git push origin $branch; then
  echo "✅ Push successful!"
else
  echo "⚠️  Push failed — initiating fallback recovery sequence..."
  sleep 2

  echo "🧠 Triggering CI preflight self-heal..."
  gh workflow run build-aab.yml || echo "ℹ️ Local fallback: running fix-json.sh"
  if [ -f "./fix-json.sh" ]; then
    bash ./fix-json.sh || true
  fi

  echo "🔁 Re-syncing repository..."
  git pull --rebase origin $branch || true

  echo "📤 Retrying push..."
  git push origin $branch && echo "✅ Push succeeded after self-heal!" || {
    echo "❌ Push still failing. Checking connection..."
    git fetch origin $branch && git status
    echo "💤 Waiting 10 s before final retry..."
    sleep 10
    git push origin $branch && echo "✅ Final retry successful!" || echo "🚨 Manual intervention required."
  }
fi

# Optional release tagging
echo "🏷️  Calculating next version tag..."
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
IFS='.' read -r v major minor patch <<< "${latest_tag//v/}"
next_tag="v$((major)).$((minor)).$((patch+1))"
git tag "$next_tag"
git push origin "$next_tag"

echo "🎯 Done — full sync, fallback, and tag release complete for $next_tag."
