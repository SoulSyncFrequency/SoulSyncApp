#!/bin/bash
set -e

echo "🚀 Starting intelligent Git push + auto-release sequence..."

# Detect active branch
branch=$(git rev-parse --abbrev-ref HEAD)
echo "🌐 Active branch: $branch"

# Stage all changes
git add -A

# Commit only if there are changes
if ! git diff --cached --quiet; then
  msg="${1:-release}"
  git commit -m "$msg"
else
  echo "✅ No new changes to commit."
fi

# Verify SSH connection
if ! ssh -T git@github.com 2>/dev/null | grep -q "successfully authenticated"; then
  echo "🔑 SSH connection not verified. Trying to auto-fix..."
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519 2>/dev/null || true
fi

# Push main branch
git push origin "$branch"
echo "✅ Push successful!"

# Auto-tagging logic
echo "🏷️  Auto-tagging enabled — calculating next version..."
last=$(git describe --tags --abbrev=0 2>/dev/null || echo "v400")
num=$(echo "$last" | tr -dc '0-9')
[ -z "$num" ] && num=400
next="v$((num+1))"

# Delete tag if already exists
git push origin ":refs/tags/$next" 2>/dev/null || true
git tag -d "$next" 2>/dev/null || true

# Create and push new tag
git tag "$next"
git push origin "$next"
echo "📦 Created GitHub tag $next"

# Create GitHub release (if gh CLI exists)
if ! command -v gh &>/dev/null; then
  echo "⚠️  GitHub CLI (gh) not found — skipping release upload."
else
  if ls android/app/build/outputs/bundle/release/*.aab >/dev/null 2>&1; then
    gh release create "$next" android/app/build/outputs/bundle/release/*.aab \
      --notes "Automated AAB build and release ($next)"
  else
    echo "⚠️  Release file not found, skipping upload."
  fi
fi

# Clean npm cache (optional)
if [ -d "$HOME/.npm/_cacache" ]; then
  echo "🧹 Cleaning local npm cache >50MB (if any)..."
  npm cache clean --force >/dev/null 2>&1 || true
fi

echo "🎯 Done — repository is fully synced and optimized!"
