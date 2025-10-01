# SoulSync – Deployment Guide

This guide shows how to run SoulSync on **Render**, **Docker**, and **Kubernetes**.

## 1) Environment Variables
See `.env.example`. Minimum:
- `REDIS_URL`
- `ADMIN_TOKEN` or `ADMIN_TOKENS="user:token"`
- `ADMIN_PURGE_ENABLED=true`
- Optional: `POSTGRES_URL`, `METRICS_TOKEN`, `ADMIN_UI_ENABLED=false`

## 2) Render
`render.yaml` is already included. Recommended settings:
- Build Command: `npm run build --workspace=backend`
- Start Command: `npm run start:prod --workspace=backend`
- Instance: `Starter` or above
- Env Vars: set `REDIS_URL`, `ADMIN_TOKENS`, `METRICS_TOKEN`, etc.

## 3) Docker (single container)
```bash
docker build -t soulsync/backend:local ./backend
docker run --rm -p 3000:3000 --env-file .env soulsync/backend:local
# Smoke tests
curl -s http://localhost:3000/healthz
curl -s http://localhost:3000/readyz
curl -s http://localhost:3000/metrics
```

## 4) Docker Compose (QA stack)
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001  (import dashboard from infra/monitoring/grafana)
```

## 5) Kubernetes (manifests below)
Apply manifests:
```bash
kubectl apply -f infra/k8s/
```

### 5.1 Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: soulsync-backend
spec:
  replicas: 2
  selector:
    matchLabels: { app: soulsync-backend }
  template:
    metadata:
      labels: { app: soulsync-backend }
    spec:
      containers:
        - name: backend
          image: ghcr.io/your-org/soulsync-backend:1.0.0
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef: { name: soulsync-config }
            - secretRef:    { name: soulsync-secrets }
          readinessProbe:
            httpGet: { path: /readyz, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /healthz, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests: { cpu: "100m", memory: "256Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
```

### 5.2 Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: soulsync-backend
spec:
  selector: { app: soulsync-backend }
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
```

### 5.3 Ingress (example)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: soulsync-backend
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: soulsync.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: soulsync-backend
                port:
                  number: 80
```

### 5.4 ConfigMap & Secret
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: soulsync-config
data:
  NODE_ENV: "production"
  ADMIN_PURGE_ENABLED: "true"
  ADMIN_UI_ENABLED: "false"
---
apiVersion: v1
kind: Secret
metadata:
  name: soulsync-secrets
type: Opaque
stringData:
  REDIS_URL: "redis://redis:6379"
  ADMIN_TOKENS: "ops:REDACTED"
  METRICS_TOKEN: "REDACTED"
```

## Database migrations
Migrations are automated:
- **GitHub Actions**: `.github/workflows/prisma-migrate.yml` runs `npx prisma migrate deploy` on push to main.
- **Render**: `render.yaml` includes `preDeployCommand: npx prisma migrate deploy`.

## Schema consistency check
CI runs:
```bash
npx prisma migrate diff --from-schema-datamodel ./prisma/schema.prisma --to-migrations ./prisma/migrations --exit-code
```
This ensures that every schema change has a matching migration. If not, the workflow fails.
