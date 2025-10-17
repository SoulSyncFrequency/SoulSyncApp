# Failover Playbook (Kubernetes + optional SSH)

Ovaj priručnik opisuje brzi postupak prebacivanja na **novu PostgreSQL bazu** nakon incidenta.

## 🔁 K8s Failover (preporučeno)

1) Pokreni GitHub Actions workflow **Failover** (tab *Actions → Failover → Run workflow*).  
2) Unesi novi `DATABASE_URL` (iz RDS/CloudSQL/Azure restore-a).  
3) Workflow će:
   - Patchati K8s secret `therapy-backend-secrets` novom vrijednošću
   - Napraviti rollout restart backend deploymenta
   - Pokrenuti `helm upgrade` radi sinkronizacije

Preduvjet: u **GitHub Secrets** mora biti `KUBE_CONFIG_DATA` (base64 kubeconfig).

## 🖥️ SSH Failover (Docker host)

Ako koristiš jednokontejnerski deploy preko SSH:
- Postavi **ENV_FILE_PATH** (npr. `/opt/therapy/.env`) kao GitHub Secret
- Pokreni **Failover** workflow i on će:
  - preko SSH zamijeniti `DATABASE_URL=` u `.env`
  - restartati Docker container `therapy`

> Ako ENV_FILE_PATH nije postavljen, SSH job se preskače.

## 🧪 Post-failover provjera

- `kubectl get pods` → provjeri da su backend podovi `Running`
- `kubectl logs deploy/therapy-engine-backend` → provjeri konekciju na novu bazu
- Provjeri `/health` endpoint backend-a
