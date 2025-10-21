#!/bin/bash
set -e

echo "🚀 Starting self-healing Git push + CI release pipeline..."

branch=$(git rev-parse --abbrev-ref HEAD)
echo "🌐 Active branch: $branch"

# Stage changes
git add -A

# Commit if needed
if ! git diff --cached --quiet; then
  msg="${1:-release}"
  git commit -m "$msg"
else
  echo "✅ No new changes to commit."
fi

# SSH health check & fix
if ! ssh -T git@github.com 2>/dev/null | grep -q "successfully authenticated"; then
  echo "🔑 SSH not verified — auto-repairing..."
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519 2>/dev/null || true
fi

# Push main
git push origin "$branch"
echo "✅ Branch pushed successfully!"

# Tag logic
echo "🏷️  Calculating next semantic version..."
last=$(git describe --tags --abbrev=0 2>/dev/null || echo "v400")
num=$(echo "$last" | tr -dc '0-9')
[ -z "$num" ] && num=400
next="v$((num+1))"

git push origin ":refs/tags/$next" 2>/dev/null || true
git tag -d "$next" 2>/dev/null || true
git tag "$next"
git push origin "$next"
echo "📦 Created and pushed tag: $next"

# Local prebuild (optional)
if [ -d "android" ] && [ -f "android/gradlew" ]; then
  echo "🏗️ Local Gradle preflight (optional)..."
  cd android && ./gradlew clean >/dev/null 2>&1 || true
  cd ..
fi

# Trigger GitHub workflow (if GH CLI exists)
if command -v gh &>/dev/null; then
  echo "🛰️  Triggering remote GitHub workflow build-aab.yml..."
  gh workflow run build-aab.yml -r "$branch" || echo "⚙️  Workflow will auto-trigger via tag."
else
  echo "⚙️  GitHub CLI not found — relying on auto-trigger via tag push."
fi

# Cleanup & optimization
if [ -d "$HOME/.npm/_cacache" ]; then
  echo "🧹 Cleaning npm cache..."
  npm cache clean --force >/dev/null 2>&1 || true
fi

echo "🎯 Done — self-healing push + release pipeline v4.0 completed for $next."
