# Release Process

## 1. Tagging
- Create a new version tag: `vX.Y.Z`
- Push tag to GitHub

## 2. Workflows Triggered
- **Release.yml**: bumps package.json, generates CHANGELOG, tags
- **Docker Release**: builds and pushes backend image to GHCR/DockerHub
- **GitHub Release**: publishes release notes from CHANGELOG
- **Sentry Release**: tags release in Sentry (if configured)

## 3. Staging / Canary / Production
- `v*-staging` → staging deployment
- `v*-canary` → canary rollout with progressive traffic shifting
- `v*` → full production rollout

## 4. Post-Release
- Run `health-checks.yml` to validate deployment
- Run `helm-test.yml` if needed
- Monitor Grafana dashboards & logs

