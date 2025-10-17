# Argo Rollouts & Chaos Testing

## Argo Rollouts
- Primjeri u `helm/values-examples/rollout-canary.yaml` i `rollout-bluegreen.yaml`.
- Za korištenje:
  1. Instaliraj Argo Rollouts CRD (operator).
  2. Primijeni Rollout resource umjesto standardnog Deploymenta.
  3. Prati rollout u Argo UI ili CLI.

## Chaos Testing
- Workflow `chaos-test.yml`:
  - Briše jedan `backend` pod (simulacija kvara) i zatim provjerava health.
  - Proširi po želji sa `chaos-mesh`/`litmus` scenarijima (network delay, cpu hog...).

## Sentry Release Tagging
- Release workflowi automatski tagiraju Sentry release ako su postavljeni:
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- U aplikaciji Sentry `release` tag je dostupan i kroz `/version` endpoint (preporuka: postavi `SENTRY_RELEASE` u env).
