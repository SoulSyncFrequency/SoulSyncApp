# Release Strategy

We use three flows for releases:

## Staging
- Triggered by pushing tag `v*-rc` or `v*-staging`.
- Image pushed with `:staging` tag to GHCR.
- Deployment in staging environment.

## Canary
- Tag with `v*-canary`.
- Image built with tag `:canary`.
- Use Helm `values-canary.yaml` to deploy a subset (e.g. 10%) of pods with label `track=canary`.
- Ingress annotations route small % of traffic to canary.

## Production
- Tag with `v*` (no suffix).
- Image pushed with version and `:latest`.
- Deployment with stable values.
- Full rollout once canary validated.

## Build Info
- Each image receives build args `BUILD_SHA` and `BUILD_TIME` and exposes them at `/version`.

