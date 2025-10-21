#!/bin/bash
set -e

echo "🚀 Starting self-healing Git push + CI release pipeline v4.1..."

branch=$(git rev-parse --abbrev-ref HEAD)
echo "🌐 Active branch: $branch"

# Auto-sync with remote
echo "🔄 Syncing with remote before push..."
git fetch origin "$branch"
git merge origin/"$branch" --no-edit || true

# Stage + commit
git add -A
if ! git diff --cached --quiet; then
  msg="${1:-release}"
  git commit -m "$msg"
else
  echo "✅ No new changes to commit."
fi

# SSH check
if ! ssh -T git@github.com 2>/dev/null | grep -q "successfully authenticated"; then
  echo "🔑 SSH not verified — auto-repairing..."
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519 2>/dev/null || true
fi

# Push branch
git push origin "$branch"
echo "✅ Branch pushed successfully!"

# Tag auto-increment
echo "🏷️  Calculating next tag..."
last=$(git describe --tags --abbrev=0 2>/dev/null || echo "v400")
num=$(echo "$last" | tr -dc '0-9')
[ -z "$num" ] && num=400
next="v$((num+1))"

git push origin ":refs/tags/$next" 2>/dev/null || true
git tag -d "$next" 2>/dev/null || true
git tag "$next"
git push origin "$next"
echo "📦 Created and pushed tag: $next"

# Trigger workflow
if command -v gh &>/dev/null; then
  echo "🛰️  Triggering remote workflow..."
  gh workflow run build-aab.yml -r "$branch" || echo "⚙️ Auto-trigger via tag."
else
  echo "⚙️ GitHub CLI not found — workflow will auto-trigger."
fi

# Clean cache
if [ -d "$HOME/.npm/_cacache" ]; then
  echo "🧹 Cleaning npm cache..."
  npm cache clean --force >/dev/null 2>&1 || true
fi

echo "🎯 Done — full sync + CI trigger complete for $next."
