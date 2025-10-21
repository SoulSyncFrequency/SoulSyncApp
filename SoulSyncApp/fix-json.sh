#!/bin/bash
set -e

echo "🧩 Checking package.json syntax..."

# 1. Try to validate package.json
if ! jq empty package.json >/dev/null 2>&1; then
  echo "⚠️  Invalid JSON detected. Attempting auto-fix..."
  tmpfile=$(mktemp)

  # 2. Try to auto-fix common issues
  sed -E 's/,\s*}/}/g; s/,\s*]/]/g' package.json > "$tmpfile"
  mv "$tmpfile" package.json

  # Validate again
  if ! jq empty package.json >/dev/null 2>&1; then
    echo "❌ Could not auto-fix JSON. Please open package.json manually."
    exit 1
  else
    echo "✅ package.json repaired successfully!"
  fi
else
  echo "✅ package.json is valid."
fi

# 3. Generate lockfile
echo "📦 Generating package-lock.json..."
npm install --legacy-peer-deps --package-lock-only

# 4. Commit and push changes if successful
if [ -f "package-lock.json" ]; then
  echo "🧠 Lockfile created — committing..."
  git add package.json package-lock.json
  git commit -m "ci: auto-fix JSON + regenerate lockfile for CI stability" || true
  git push origin main
  echo "🚀 Auto-fix and sync complete."
else
  echo "❌ Lockfile not created — check npm errors above."
  exit 1
fi
