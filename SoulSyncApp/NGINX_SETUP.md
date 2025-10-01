# Nginx Reverse Proxy (Local TLS)

- Compose servis `nginx` terminira TLS na 443 i prosljeđuje na `backend:3000`.
- Certifikati su **placeholderi** u `infra/nginx/certs/localhost.*` – zamijeni ih za lokalni dev (`mkcert`) ili produkciju (cert-manager).

## Lokalno
```bash
docker compose -f docker-compose.prod.yml up -d nginx
open https://localhost
```

## Produkcija (smjer)
- U Kubernetesu koristi **Ingress + cert-manager** (Let’s Encrypt). Nginx iz compose-a je samo lokalni proxy primjer.
