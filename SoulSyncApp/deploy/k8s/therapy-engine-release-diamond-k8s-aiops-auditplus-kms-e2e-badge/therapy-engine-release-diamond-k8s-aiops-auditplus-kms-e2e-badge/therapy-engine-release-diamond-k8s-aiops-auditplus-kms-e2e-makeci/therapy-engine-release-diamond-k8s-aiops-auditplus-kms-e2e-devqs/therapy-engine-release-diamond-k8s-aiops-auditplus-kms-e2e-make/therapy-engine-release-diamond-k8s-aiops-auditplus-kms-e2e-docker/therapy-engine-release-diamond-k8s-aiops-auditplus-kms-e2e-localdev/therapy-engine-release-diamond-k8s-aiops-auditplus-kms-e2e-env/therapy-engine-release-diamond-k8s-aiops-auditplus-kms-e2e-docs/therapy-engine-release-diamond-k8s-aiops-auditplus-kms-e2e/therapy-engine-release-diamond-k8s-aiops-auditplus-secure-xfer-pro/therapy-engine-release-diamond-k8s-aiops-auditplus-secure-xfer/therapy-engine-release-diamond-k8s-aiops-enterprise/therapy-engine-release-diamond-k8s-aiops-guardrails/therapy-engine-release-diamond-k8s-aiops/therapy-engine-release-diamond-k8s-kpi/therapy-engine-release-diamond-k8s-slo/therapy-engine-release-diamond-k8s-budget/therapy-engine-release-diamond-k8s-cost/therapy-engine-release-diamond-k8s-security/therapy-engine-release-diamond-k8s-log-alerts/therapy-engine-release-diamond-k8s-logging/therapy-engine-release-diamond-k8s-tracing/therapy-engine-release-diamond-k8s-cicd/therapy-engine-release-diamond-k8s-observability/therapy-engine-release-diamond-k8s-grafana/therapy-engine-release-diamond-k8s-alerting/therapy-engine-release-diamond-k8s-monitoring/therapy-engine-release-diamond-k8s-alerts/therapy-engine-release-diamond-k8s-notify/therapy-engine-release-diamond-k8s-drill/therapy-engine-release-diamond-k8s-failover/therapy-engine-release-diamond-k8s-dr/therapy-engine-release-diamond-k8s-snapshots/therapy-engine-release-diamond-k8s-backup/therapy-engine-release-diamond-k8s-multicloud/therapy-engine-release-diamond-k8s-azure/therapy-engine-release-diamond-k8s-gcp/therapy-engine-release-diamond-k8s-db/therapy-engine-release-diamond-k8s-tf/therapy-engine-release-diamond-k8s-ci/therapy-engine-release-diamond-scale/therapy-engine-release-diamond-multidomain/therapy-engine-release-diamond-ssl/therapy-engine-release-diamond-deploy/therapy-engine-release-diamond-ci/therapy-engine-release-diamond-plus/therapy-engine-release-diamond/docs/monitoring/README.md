# Observability: Monitoring + Alerting

## 1. Deploy Prometheus i Grafana
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

helm upgrade --install prometheus prometheus-community/prometheus -f ops/monitoring/prometheus-values.yaml
helm upgrade --install grafana grafana/grafana -f ops/monitoring/grafana-values.yaml
```
- Prometheus skuplja metrike svakih 15s.  
- Grafana ima default login `admin/admin123` (promijeniti u `grafana-values.yaml`).  

---

## 2. Backend metrike
Backend ima **Prometheus endpoint**:
- `GET /metrics` → standardne Node.js metrike.  
- `POST /metrics/drill-success` → postavlja custom metriku `last_successful_drill_timestamp_seconds`.

---

## 3. DR Drill integracija
Workflow `.github/workflows/dr-drill.yml`:
- simulira restore baze  
- patcha `DATABASE_URL`  
- provjerava `/health`  
- poziva `POST /metrics/drill-success` → metrika vidljiva u Grafani.  

---

## 4. Prometheus Alerting Rules
Definirano u **`ops/monitoring/prometheus-rules.yaml`**:
- **DrillNotRunRecently** → ako drill nije pokrenut > 48h  
- **BackendDown** → ako backend ne odgovara > 2m  

Učitano u Prometheus kroz `serverFiles.alerting_rules.yml` u `prometheus-values.yaml`.

---

## 5. Grafana Dashboards
U **ops/monitoring/grafana-values.yaml** konfigurirani su dashboardi:
- **Therapy Engine - DR & Backups** → health + drill metrika.  
- **Therapy Engine - Alerts** → tablica aktivnih Prometheus alarma.  

Dashboard JSON-ovi su i u `ops/monitoring/dashboards/`.

---

## 6. Notifikacije
Alertmanager šalje alarme prema Slack/Discord/PagerDuty/Email.  
Secrets u GitHub Actions konfiguraciji određuju koji kanal se koristi.  

Workflows s notifikacijama:
- `alerts.yml` (PagerDuty integration)  
- `failover.yml`, `dr-drill.yml`, `ci-cd.yml` (Slack/Discord/Email)  

---

## 7. Kako testirati
1. Pokreni DR drill workflow ručno.  
2. Provjeri Grafana dashboard “DR & Backups”.  
3. Ugasi backend pod → u 2 minute se pojavi **BackendDown** alert.  
4. Slack/Discord/PagerDuty javljaju incident.  


---

## 8. CI/CD Observability
Dodali smo **GitHub Actions Exporter** koji izlaže metrike o workflowima (status, trajanje, uspjeh/padovi).

### Deploy Exporter
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install gha-exporter prometheus-community/github-actions-exporter -f ops/monitoring/github-exporter/values.yaml
```

Potrebno je postaviti **GITHUB_TOKEN** kao Kubernetes Secret.

### Dashboard
- **Therapy Engine - CI/CD** → prikazuje:
  - zadnji status workflowa
  - trajanje workflowa
  - tablicu padova workflowa


---

## 9. End-to-End Tracing (OpenTelemetry + Jaeger/Tempo)

### Deploy Jaeger
```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm upgrade --install jaeger jaegertracing/jaeger -f ops/tracing/jaeger-values.yaml
```

### Deploy Tempo (alternativa)
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install tempo grafana/tempo -f ops/tracing/tempo-values.yaml
```

### Deploy OpenTelemetry Collector
```bash
kubectl apply -f ops/tracing/otel-collector.yaml
```

### Backend
- automatski instrumentiran pomoću OpenTelemetry SDK-a
- trace podaci šalju se u `otel-collector` i dalje u Jaeger/Tempo

### Grafana
Dodaj "Tempo" ili "Jaeger" kao datasource → koristi "Explore" za pregled trace-ova.


---

## 10. Centralizirano logiranje (Loki + Promtail)

### Deploy
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install loki grafana/loki -f ops/logging/loki-values.yaml
helm upgrade --install promtail grafana/promtail -f ops/logging/promtail-values.yaml
```

### Backend log correlation
- `backend/logger.js` koristi **OpenTelemetry traceId** i **Winston**.
- U `server.js` zamijenjeni `console.log/error` pozivi s `logger.info/error`.

### Grafana (Explore → Loki)
Primjeri upita:
```logql
{app="therapy-backend"} |= "ERROR"
{namespace="default"} |= "traceId"
```
Možeš skakati iz trace-a u log i obrnuto (correlation).


---

## 11. Log retention & alerting

### Retention
U `ops/logging/loki-values.yaml` konfiguriran je **compactor**:
- `retention_period: 168h` (7 dana, može se promijeniti npr. 720h = 30 dana).

### Alerting
U `ops/logging/loki-alerts.yaml` dodano je pravilo:
- **TooManyErrors** → alert ako ima više od 10 error logova u 5 minuta.

Alert se šalje u Alertmanager i dalje u Slack/Discord/PagerDuty/Email.


---

## 12. Security & Compliance Observability

### Falco
- Deploy: `helm upgrade --install falco falcosecurity/falco -f ops/security/falco-values.yaml`
- Custom rules: `ops/security/falco-rules.yaml` (primjer: detekcija shell u podu)

### Audit logovi
- Konfiguracija: `ops/security/audit-promtail-values.yaml`
- Scrapa Kubernetes audit logove i šalje u Loki

### Grafana Security Dashboard
- **Therapy Engine - Security Events** prikazuje:
  - broj Falco eventa po minuti
  - tablicu audit logova iz zadnjih 5 minuta

### Alerting
Falco eventi se izlažu u Prometheus → Alertmanager → Slack/Discord/PagerDuty.


---

## 13. Cost Observability (Kubecost)

### Deploy Kubecost
```bash
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm upgrade --install kubecost kubecost/cost-analyzer -n kubecost --create-namespace -f ops/monitoring/kubecost/values.yaml
```
- Integrira se s postojećim Prometheusom (`prometheus-server`).
- U Grafani je dostupan dashboard **Therapy Engine - Costs** (cluster cost, cost by ns, top deployments).

### Cost Alerting
Prometheus pravilo: `ops/monitoring/prometheus-cost-rules.yaml`
- **CostSpikeCluster** → alert kad `sum(kubecost_cluster_cost) > 1000` (prilagodi prag).

> Napomena: Kubecost može imati različite nazive metrika po verziji. Ako metrike ne postoje, otvori Kubecost UI i provjeri točne nazive pa ažuriraj dashboard/pravila.


---

## 14. Budget observability

### Prometheus pravilo
`ops/monitoring/prometheus-budget-rules.yaml`  
- **NamespaceBudgetExceeded** → alert ako namespace troši više od definiranog budžeta.

### Dashboard
- **Therapy Engine - Budgets**
  - graf: cost vs budget po namespace-u
  - tablica: prekoračenja po namespace-u

### Metrika
- `kubecost_namespace_budget` mora biti definirana (preko Kubecost configs ili recording rules).
- Omogućuje usporedbu stvarnog troška sa zadanim budžetom.



---

## 15. SLO / SLI observability

### Recording rules
- `ops/monitoring/prometheus-slo-rules.yaml`  
  - `http_requests:success_rate` → postotak uspješnih requesta  
  - `http_requests:latency_p99` → 99. percentil latencije  

### Alerts
- `ops/monitoring/prometheus-slo-alerts.yaml`  
  - **SLOErrorBudgetBurn** → više od 1% requesta neuspješno u zadnjih 15 min  

### Dashboard
- **Therapy Engine - SLOs** → gauge (success rate), stat (p99 latency), graf (error budget burn)



---

## 16. Business KPI observability

### KPI metrike (iz backend-a)
- `therapy_sessions_total` – broj pokrenutih terapija
- `therapy_sessions_success_total` – broj uspješnih terapija
- `therapy_active_users` – broj aktivnih korisnika
- `therapy_revenue_total` – ukupni prihod

### Prometheus recording rules
- `ops/monitoring/prometheus-kpi-rules.yaml`
  - `therapy:success_rate` = uspješnost terapija

### Dashboard
- **Therapy Engine - Business KPIs**
  - Active users (stat)
  - Total revenue (stat)
  - Therapy success rate (gauge)
  - Sessions over time (graph)


---

## 17. AIOps & Anomaly Detection

### Komponente
- **ops/aiops/detector/** → Python servis (IsolationForest + z-score) koji prati ključne metrike iz Prometheusa i izbacuje anomalije.
- Izlaže `/metrics` (Prometheus) s metrikama: `aiops_anomaly_current{metric=...}`, `aiops_anomaly_score{metric=...}`.

### Deploy
1. Build & deploy automatiziran kroz **CI job `build-aiops-detector`** (u `.github/workflows/ci-cd.yml`).
2. Ručno:
```bash
docker build -t ghcr.io/<owner>/<repo>-aiops:latest ops/aiops/detector
docker push ghcr.io/<owner>/<repo>-aiops:latest
sed -e 's#ghcr.io/REPLACE_WITH_OWNER/therapy-aiops:latest#ghcr.io/<owner>/<repo>-aiops:latest#g' ops/aiops/aiops-detector.yaml | kubectl apply -f -
```

### Konfiguracija
- `ops/aiops/aiops-detector.yaml` koristi Secret **`aiops-secrets`** (PROM_URL, PROM_TOKEN, SLACK/DISCORD webhookovi, PAGERDUTY key).
- Prometheus alert pravilo: `ops/monitoring/prometheus-aiops-rules.yaml` (AIOpsAnomalyDetected).

### Grafana
- Dashboard **Therapy Engine - AIOps** (tablica aktivnih anomalija + graf score-a).

### Napomena
- Lista metrika pod kontrolom varijable `AIOPS_METRICS` (default: success rate, p99 latency, therapy success rate, cluster cost).
- Ako `scikit-learn` nije dostupan, koristi se z-score fallback.


---

## 18. AIOps Feature Store & Retraining
- Schema: `ops/aiops/sql/001_init.sql`; migracija: `ops/aiops/sql/migrate.py`
- Model storage: `aiops_models` (pickle); retraining skripta: `ops/aiops/train.py`
- Workflow: `.github/workflows/aiops-retrain.yml`

## 19. AIOps Explainability (XAI)
- Razlozi: `level_shift`, `volatility_spike`, `trend_break`, `percent_change`
- Metrike: `aiops_anomaly_info{metric,reason}`, `aiops_anomaly_zscore{metric,window}`, `aiops_anomaly_delta{metric}`
- Pragovi: `AIOPS_Z_THRESH`, `AIOPS_VOL_MULT`, `AIOPS_PCT_THRESH`
- Dashboard: `ops/monitoring/dashboards/aiops-xai.json` (+ auto-load u `grafana-values.yaml`)

## 20. Incident Auto‑Runbooks
- Webhook (`ops/runbooks/webhook`) i Collector (`ops/runbooks/collector`), uploada u S3/GCS/Azure
- Trigger iz AIOps detektora ili Alertmanagera (`/alertmanager`)
- YAML: `ops/runbooks/runbooks.yaml`

## 21. Multi‑Cloud Storage & Alertmanager Integration
- Collector upload: **S3**, **GCS**, **Azure Blob** (postavi odgovarajuće env varijable)
- Alertmanager: receiver s `webhook_configs` na `http://runbooks-webhook.runbooks.svc:8080/alertmanager`

## 22. Auto‑Remediation (sigurno & kontrolirano)
- Akcije: `restart_pods`, `rollout_restart`, `scale_up/down`
- Politika: `RUNBOOK_AUTOFIX_POLICY` (npr. `crashloop=restart_pods;success_rate:trend_break=rollout_restart;latency_p99:level_shift=scale_up:+1`)
- Default: `RUNBOOK_AUTOFIX_ENABLED=false`, `RUNBOOK_AUTOFIX_DRY_RUN=true`

## 23. Guardrails: Circuit Breaker & Approval Gate
- Circuit breaker (po app labelu): `RUNBOOK_CIRCUIT_MAX_HOURLY` (3), `RUNBOOK_CIRCUIT_MAX_DAILY` (10); koristi Redis (`RUNBOOK_REDIS_URL`) ili in‑memory.
- Approval gate (Slack): `RUNBOOK_AUTOFIX_REQUIRE_APPROVAL=true`, `RUNBOOKS_SLACK_WEBHOOK`, `RUNBOOK_APPROVAL_SECRET`.
- Endpoints: `/approve?id=...&token=...`, `/reject?id=...&token=...`.


---

## 24. Audit Log + Policy ConfigMap + Slack Interactive Approvals

### Audit log (Postgres)
- Nova tablica: `runbooks_audit` (vidi `ops/aiops/sql/001_init.sql`).
- Webhook zapisuje događaje: `request`, `collector_started`, `approval_pending`, `approved`, `rejected`, `executed`, `skipped_circuit`, `skipped_no_approval`…
- Za migraciju pokreni workflow **AIOps DB Migrate** (re-run).

### Granularne politike kroz ConfigMap
- ConfigMap `runbooks-policy` u ns `runbooks`. Ključevi (prioritetnim redoslijedom):
  1. `<namespace>.<app_label>`
  2. `<namespace>.*`
  3. `*.<app_label>`
  4. `default`
- Webhook uzima politiku iz ConfigMapa, fallback na env `RUNBOOK_AUTOFIX_POLICY`.

### Slack interaktivna odobrenja
- Postavi: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL`, `SLACK_SIGNING_SECRET` u `runbooks-webhook` Deploymentu.
- Webhook šalje poruku s gumbima **Approve/Reject** (Slack Blocks). Slack šalje event na `/slack/interactive` (potpis provjeren HMAC-om).
- Fallback: ako bot token nije postavljen, koristi se običan `RUNBOOKS_SLACK_WEBHOOK` (bez gumba).

### Napomena
- Ako želiš centralizirani pregled audita, može se dodati Grafana panel ili SQL export (SELECT * FROM runbooks_audit ORDER BY ts DESC LIMIT 500).


---

## 25. Audit Reporting (Grafana + CSV Export)
- Dashboard: `ops/monitoring/dashboards/runbooks-audit.json` (datasource: Postgres `aiopsdb`)
- CSV export: `ops/runbooks/export_audit.py`
- Workflow: `.github/workflows/export-audit.yml` (cron + artifact upload)

## 26. Security Enhancements (MSAL + Filename masking)
- MSAL: `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` → auto Graph token
- Masking: `AUDIT_FILENAME_MODE=hashed` (+ `AUDIT_FILENAME_SALT`)

## 27. PGP Encryption + SFTP Upload
- PGP: `AUDIT_ENCRYPTION=on`, `AUDIT_PGP_PUBLIC_KEY` ili `AUDIT_PGP_PUBLIC_KEY_FILE`, `AUDIT_PGP_DELETE_PLAINTEXT=true|false`
- SFTP: `SFTP_HOST`, `SFTP_PORT`, `SFTP_USERNAME`, `SFTP_PASSWORD` **ili** `SFTP_PRIVATE_KEY` (+ `SFTP_PASSPHRASE`), `SFTP_REMOTE_DIR`, `SFTP_RETENTION_DAYS`
- Integracije zadržane: S3 (upload+retention), GCS/Azure (retention), Google Drive/Dropbox/OneDrive/SharePoint (upload+retention)


### 28. Advanced PGP & SFTP Verification
- **PGP multi-recipient**:
  - `AUDIT_GPG_CLI=on` + `AUDIT_PGP_PUBLIC_KEYS` (inline ASCII, comma-separated) ili `AUDIT_PGP_PUBLIC_KEY_FILES` (paths) → jedan `.gpg` fajl za sve primatelje (gpg CLI).
  - Ako `AUDIT_GPG_CLI` nije postavljen → PGPy enkripcija; više primatelja = više `.gpg` fajlova (po primatelju).
  - `AUDIT_PGP_COMMENT` dodaje `Comment:` header u ASCII-armor.
- **SFTP verifikacija**:
  - `SFTP_VERIFY=size|sha256|off` – nakon uploada provjerava veličinu ili SHA256 checksum (preporučeno: `sha256`).



## 29. KMS/KeyVault Integracija (Envelope Encryption + PGP iz Secret Managera)
- **PGP ključ iz tajnog spremišta** (prioritetno, ako `AUDIT_PGP_PUBLIC_KEY` nije postavljen):
  - AWS Secrets Manager: `AWS_PGP_SECRET_NAME`
  - GCP Secret Manager: `GCP_PROJECT_ID`, `GCP_PGP_SECRET_NAME`
  - Azure Key Vault Secrets: `AZURE_KEY_VAULT_URL`, `AZURE_KV_PGP_SECRET_NAME`
- **Envelope enkripcija (AES-GCM + wrap ključa)** – omogući s `AUDIT_ENC_MODE=kms` ili `pgp+kms`:
  - AWS KMS: `AWS_KMS_KEY_ID` (+ `AWS_REGION`)
  - GCP KMS: `GCP_KMS_KEY` (resource name `projects/.../locations/.../keyRings/.../cryptoKeys/...`)
  - Azure Key Vault Keys: `AZURE_KV_KEY_ID` (+ `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` ili `DefaultAzureCredential`)
  - Rezultat: `<naziv>.(csv|gpg).envelope.json` s `wrapped_keys`, `nonce`, `ciphertext` (Base64).  
  - `AUDIT_KMS_DELETE_ORIGINAL=true|false` kontrolira brisanje originala nakon envelope enkripcije.

## 30. E2E Test Workflow
- Workflow: `.github/workflows/test-audit.yml`
- Što radi:
  1) Generira test PGP ključ (gpg, bez lozinke), export public key → `pub.asc`  
  2) Pokreće SFTP container (`atmoz/sftp`) s lokalnim mountom  
  3) Run `export_audit.py` u **mock DB** modu (`AIOPS_DATABASE_URL=mock`) uz PGP enkripciju i `SFTP_VERIFY=size`  
  4) Uploada artefakte (`*.csv*`, `sftp/**`) za pregled  
- Savjeti: po potrebi promijeni `SFTP_VERIFY=sha256` i dodaj `AUDIT_ENC_MODE=pgp+kms` da testiraš i envelope enkripciju.


## 31. Decryption Guide (AWS/GCP/Azure)

### 📂 Format
Each `.envelope.json` file contains:
```json
{
  "scheme": "envelope-aesgcm",
  "original_filename": "audit-20250905.csv",
  "wrapped_keys": { "aws_kms": "...", "gcp_kms": "...", "azure_kv": "..." },
  "nonce": "...",
  "ciphertext": "...",
  "created": "2025-09-05T01:23:45Z"
}
```

### 🔹 AWS KMS
```bash
aws kms decrypt   --ciphertext-blob fileb://<(echo "<wrapped_keys.aws_kms>" | base64 -d)   --query Plaintext --output text   | base64 -d > data.key
```
```python
from base64 import b64decode
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import json

meta = json.load(open("audit-20250905.csv.envelope.json"))
key = open("data.key","rb").read()
nonce = b64decode(meta["nonce"])
ct = b64decode(meta["ciphertext"])
aesgcm = AESGCM(key)
plaintext = aesgcm.decrypt(nonce, ct, None)
open(meta["original_filename"],"wb").write(plaintext)
```

### 🔹 GCP KMS
```bash
echo "<wrapped_keys.gcp_kms>" | base64 -d > wrapped.bin
gcloud kms decrypt   --ciphertext-file=wrapped.bin   --plaintext-file=data.key   --location=global   --keyring=my-keyring   --key=my-key
```
Use `data.key` with AES-GCM as in AWS example.

### 🔹 Azure Key Vault Keys
```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.keys.crypto import CryptographyClient, KeyWrapAlgorithm
from base64 import b64decode
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

meta = json.load(open("audit-20250905.csv.envelope.json"))
wrapped = b64decode(meta["wrapped_keys"]["azure_kv"])
cred = DefaultAzureCredential()
crypto = CryptographyClient(key_identifier="<AZURE_KV_KEY_ID>", credential=cred)
res = crypto.unwrap_key(KeyWrapAlgorithm.rsa_oaep_256, wrapped)
key = res.key
aesgcm = AESGCM(key)
plaintext = aesgcm.decrypt(b64decode(meta["nonce"]), b64decode(meta["ciphertext"]), None)
open(meta["original_filename"],"wb").write(plaintext)
```

### ✅ Recommendation
- CI/CD pipelines: prefer PGP (`pgp` or `pgp+kms`)
- Long-term archive: use KMS-only (`kms`)
- Local test: use `mock` mode with `.github/workflows/test-audit.yml`


## 32. Local Dev Guide (Kako koristiti `.env.example` lokalno)

1. **Kopiraj primjer**
   ```bash
   cp .env.example .env
   ```

2. **Odaberi mod rada**
   - **Test/mock mod** (preporučeno za lokalni rad):  
     U `.env` postavi:
     ```
     AIOPS_DATABASE_URL=mock
     ```
     Time se koristi ugrađeni demo set audita → nije potreban pravi Postgres.
   - **Production mod**:  
     Postavi pravi `AIOPS_DATABASE_URL` (npr. Postgres, RDS, CloudSQL).

3. **Pokreni export ručno**
   ```bash
   pip install -r requirements.txt
   python ops/runbooks/export_audit.py
   ```
   Rezultat: `audit-YYYYMMDD.csv` ili enkriptirani `.gpg` / `.envelope.json` fajl.

4. **Odaberi način enkripcije**
   - Samo PGP:
     ```
     AUDIT_ENCRYPTION=on
     AUDIT_PGP_PUBLIC_KEY=-----BEGIN PGP PUBLIC KEY BLOCK-----...
     ```
   - Samo KMS (envelope AES-GCM):
     ```
     AUDIT_ENC_MODE=kms
     AWS_KMS_KEY_ID=...
     ```
   - Kombinacija (PGP + KMS):
     ```
     AUDIT_ENC_MODE=pgp+kms
     ```

5. **Testiraj SFTP upload (lokalno)**
   - Pokreni SFTP container:
     ```bash
     docker run -d --name sftp -p 2222:22 -e SFTP_USERS="test:pass:1001" -v $(pwd)/sftp:/home/test/upload atmoz/sftp
     ```
   - U `.env` postavi:
     ```
     SFTP_HOST=127.0.0.1
     SFTP_PORT=2222
     SFTP_USERNAME=test
     SFTP_PASSWORD=pass
     SFTP_REMOTE_DIR=/upload
     SFTP_VERIFY=sha256
     ```
   - Ponovno pokreni export → fajl ide u `sftp/`.

6. **Provjeri izlaz**
   ```bash
   ls -la
   ls -la sftp/
   ```


## 33. Dev Quickstart with Makefile

Za jednostavno podizanje i gašenje servisa koristi se **Makefile** u root direktoriju.

### 📋 Komande
- `make up` – build + podizanje svih servisa (app, db, sftp)  
- `make down` – zaustavljanje servisa  
- `make logs` – live logovi svih servisa  
- `make ps` – status containera  
- `make rebuild` – rebuild bez cache-a  
- `make clean` – obrisati containere, volumene i sadržaj `sftp/`  

### 🚀 Primjer
```bash
cp .env.example .env
make up
make logs
ls -la sftp/
make down
```
