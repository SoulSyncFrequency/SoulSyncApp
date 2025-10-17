#!/usr/bin/env sh
set -e

REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
INDEX_VERSION="${REDISEARCH_INDEX_VERSION:-v1}"
IDX_NAME="idx:docs:${INDEX_VERSION}"

# Wait for Redis
echo "Waiting for Redis at $REDIS_HOST:$REDIS_PORT..."
for i in $(seq 1 50); do
  if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" PING >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

# Create index if missing
if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" FT.INFO "$IDX_NAME" >/dev/null 2>&1; then
  echo "Index idx:docs already exists."
else
  echo "Creating RediSearch index $IDX_NAME..."
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" FT.DROPINDEX "$IDX_NAME" KEEPDOCS >/dev/null 2>&1 || true
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" FT.CREATE "$IDX_NAME" ON HASH PREFIX 1 doc: SCHEMA title TEXT content TEXT tags TAG SEPARATOR ,
fi

# Seed sample docs
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" HSET doc:1 title "Hello SoulSync" content "Sample document for therapy & nutrition." tags "therapy,nutrition"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" HSET doc:2 title "Quantum Module" content "F0 resonance & bio-photonic molecules." tags "f0,quantum"
echo "RediSearch seeded."
