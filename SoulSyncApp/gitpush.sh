#!/bin/bash
set -e

echo "🚀 Starting intelligent Git push + auto-release sequence..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🔍 Active branch: $BRANCH"

# Stage everything
git add -A

# Commit message
if [ -z "$1" ]; then
  MSG="auto: commit + tag at $(date '+%Y-%m-%d %H:%M:%S')"
else
  MSG="$1"
fi

git commit -m "$MSG" || echo "ℹ️ No new changes to commit."

# Attempt normal push first
if git push origin "$BRANCH"; then
  echo "✅ Push successful!"
else
  echo "⚠️ Push rejected — syncing..."
  git fetch origin "$BRANCH"
  git pull --rebase origin "$BRANCH" || git rebase --abort || true
  git push origin "$BRANCH" --force-with-lease
  echo "🔁 Auto-sync complete."
fi

# ----------------------------
# 🔖 AUTO-TAG + RELEASE SECTION
# ----------------------------
if [[ "$1" == "release" || "$1" == "tag" ]]; then
  echo "🏷️  Auto-tagging enabled — calculating next version..."
  git config user.name "SoulSyncFrequency"
  git config user.email "soulsyncfrequency@gmail.com"

  # Determine next tag
  last=$(git describe --tags --abbrev=0 2>/dev/null || echo "v400")
  num=${last//[!0-9]/}
  [[ -z "$num" ]] && num=400
  next="v$((num+1))"

  git tag "$next"
# Ako tag već postoji, automatski ga briše i ponovno stvara
git push origin ":refs/tags/$next" 2>/dev/null || true
git tag -d "$next" 2>/dev/null || true
git tag "$next"
  git push origin "$next"

  echo "📦 Creating GitHub release for $next..."
  gh release create "$next" \
    android/app/build/outputs/bundle/release/*.aab \
    --notes "Automated AAB build and release ($next)" || \
    echo "⚠️ Release file not found, skipping upload."

  echo "🚀 Created release $next"
fi

# ----------------------------
# 🧹 CLEANUP SECTION
# ----------------------------
echo "🧹 Cleaning local npm cache >50MB (if any)..."
find ~/.npm/_cacache -type f -size +50M -delete 2>/dev/null || true

echo "🎯 Done — repository is fully synced and optimized!"
