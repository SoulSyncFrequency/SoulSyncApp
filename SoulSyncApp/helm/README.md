# SoulSync Helm Deploy (Quick Start)

## Prereqs
- Kubernetes cluster + NGINX Ingress + cert-manager (for TLS)
- Container registry with backend image pushed (see CI build workflow)
- Postgres & Redis (managed or in-cluster)

## Install
```bash
helm upgrade --install soulsync ./chart   -f helm/values-examples/values-redis-worker.yaml   --set backend.image.repository=YOUR_REGISTRY/soulsync-backend   --set backend.image.tag=v61
```

## Notes
- Backend listens on `:3000` (mapped via Service/Ingress)
- Worker deployment consumes same image with `dist/jobs/worker.js`
- Set secrets via K8s Secrets and mount as env (see values example)
- Health: `/healthz`, `/readyz`; Metrics: `/metrics`
- Queues UI: `/admin/queues` (admin), `/ops/queues` (read-only)
```
kubectl port-forward svc/soulsync-backend 3000:3000
curl -s localhost:3000/healthz
```
