# CI/CD & Deployment Guide

This document explains how to configure GitHub Actions, Docker, and Kubernetes deployment for Therapy Engine.

## GitHub Secrets

Add these secrets under **Settings → Secrets → Actions** in your GitHub repository:

- **CR_PAT**: Personal Access Token with `write:packages` to push Docker images to GHCR.
- **SSH_HOST**: (optional) server IP/hostname for SSH deploy.
- **SSH_USER**: (optional) server user.
- **SSH_KEY**: (optional) private SSH key (use carefully).
- **KUBE_CONFIG_DATA**: Base64-encoded kubeconfig file for your Kubernetes cluster.

To generate base64 kubeconfig:

```bash
cat ~/.kube/config | base64 -w0
```

## Workflow Jobs

- **build**:
  - Installs backend/frontend deps
  - Runs lint & tests
  - Builds frontend
  - Builds and pushes backend Docker image to GHCR
  - Uploads artifacts (.aab, dist/)

- **deploy** (optional):
  - Uses SSH to pull and run Docker on your server

- **k8s-deploy**:
  - Uses kubeconfig from secrets
  - Runs `helm upgrade --install therapy ops/helm/therapy-engine -f ops/helm/therapy-engine/values.yaml --set backend.image.tag=$GITHUB_SHA`
  - Automatically updates your Kubernetes cluster with the new backend image

## Helm Chart

- Located in `ops/helm/therapy-engine/`
- Configure domains, replicas, resources in `values.yaml`
- Create secrets:

```bash
kubectl create secret generic therapy-backend-secrets --from-env-file=backend/.env
```

## Deployment Options

### Docker Compose (production with SSL)

```bash
docker-compose -f ops/docker-compose.prod.yml up -d
```

### Kubernetes (Helm)

```bash
helm upgrade --install therapy ops/helm/therapy-engine -f ops/helm/therapy-engine/values.yaml
```

Enable autoscaling:

```bash
helm upgrade therapy ops/helm/therapy-engine --set backend.hpa.enabled=true
```

---

With this setup:
- Each push to `main` automatically builds and deploys your app
- Docker images are versioned by commit SHA
- Kubernetes receives automatic rolling updates
