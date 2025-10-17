# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV LOG_DIR=/app/logs
# Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev
# Copy built dist and any runtime assets
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app appuser
COPY --from=build /app/dist ./dist
COPY --from=build /app/infra ./infra
COPY --from=build /app/.env.example ./.env.example
RUN mkdir -p /app/logs && chown -R appuser:app /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD [ "node", "dist/index.js" ]
