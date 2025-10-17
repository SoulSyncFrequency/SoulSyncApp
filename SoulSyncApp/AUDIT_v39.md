# v39 Zip Audit Report

## Presence checks
- [OK] backend/src/server.ts
- [OK] backend/Dockerfile
- [OK] charts/soulsync/Chart.yaml
- [OK] .github/workflows/quality-gate.yml
- [OK] .github/workflows/integration-tests.yml
- [OK] docker-compose.prod.yml

## Potential issues
- Sensitive-looking string in /mnt/data/ss_fullapp_v39_correct/README_ALERTING.md
- Sensitive-looking string in /mnt/data/ss_fullapp_v39_correct/RENDER_GUIDE.md
- Potential secret file committed: /mnt/data/ss_fullapp_v39_correct/frontend/.env
- Potential secret file committed: /mnt/data/ss_fullapp_v39_correct/frontend/config/imported/frontend-env-config/frontend/.env
- Sensitive-looking string in /mnt/data/ss_fullapp_v39_correct/ops/README_DEPLOY.md
- Potential secret file committed: /mnt/data/ss_fullapp_v39_correct/charts/soulsync/templates/secrets.yaml
