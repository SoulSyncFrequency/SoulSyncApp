# Config Validation

Runtime provjera konfiguracije je implementirana u **`backend/src/config.ts`** koristeći **Zod**.

## Ključne varijable
- `NODE_ENV` — `development|test|production` (default: `production`)
- `PORT` — port (default: `3000`)
- `CLIENT_ORIGIN` — URL frontenda (preporuka u produkciji)
- `ADMIN_TOKEN` — token za admin guard (preporuka u produkciji)
- `SENTRY_DSN` — opcionalno
- `METRICS_TOKEN` — opcionalno (ako želiš zaštititi `/metrics`)
- `RELEASE_VERSION` — opcionalno; setira se u CI (Prometheus `build_info`)

Ako je konfiguracija nevaljana, aplikacija će se zaustaviti s jasnom porukom o grešci.
