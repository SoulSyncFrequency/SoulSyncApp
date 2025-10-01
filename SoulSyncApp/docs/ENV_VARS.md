# Environment Variables (Backend & Frontend)

## Backend
- `ALLOWED_HOSTS` — comma-separated host allowlist (empty = allow all; `localhost`/`127.0.0.1` always allowed)
- `ENABLE_API_DOCS` — `'true'|'false'` to expose `/api/docs` and `/api/openapi.yaml` (default `true`)
- `MAINTENANCE_MODE` — `'true'` to return 503 for non-essential endpoints
- `SLOW_REQ_MS` — threshold in ms to WARN slow requests (default 750)
- `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`, `CORS_MAX_AGE` — CORS tuning
- `ENABLE_HSTS` (`true/false`) and `HSTS_MAX_AGE` — set HSTS only behind HTTPS
- `CSP_ENFORCE` — `'true'` switches to enforced CSP (otherwise Report-Only)
- `SECURITY_CONTACT`, `SECURITY_POLICY_URL` — used by `/.well-known/security.txt`
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` — Sentry backend
- `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE` — Sentry sampling
- `ENABLE_TEST_ENDPOINTS` — expose `/api/_test-error` for Sentry test
- `GIT_SHA` — included in `/api/version` and metrics `build_info`

## Frontend (Vite)
- `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_RELEASE`
- `VITE_SENTRY_TRACES_SAMPLE_RATE` — default 0.5
- `VITE_SENTRY_REPLAY` — `'true'|'false'` (default `false`)


- `ENABLE_HTTPS_REDIRECT` — `'true'` preusmjerava HTTP→HTTPS (kad je ispred reverse proxyja)

- `COEP_ENFORCE` — `'true'` postavlja `Cross-Origin-Embedder-Policy` (umjesto Report-Only)

- `CORS_ORIGIN` — `*` ili CSV lista origin-a (podržava `*.domain.com`) za CORS
- `ROBOTS_INDEX` — `'true'|'false'` (default `false`): ako `false`, šalje `X-Robots-Tag: noindex, nofollow`
- `HSTS_PRELOAD` — `'true'|'false'`: dodaje `preload` u HSTS (oprez: koristi samo uz full HTTPS pokrivenost)

- `ENABLE_COMPRESSION` — `'true'|'false'` uključuje gzip/deflate kompresiju odgovora (default `true`, metrics su izuzeti)
- `TRUST_PROXY` — Express trust proxy vrijednost (default `'1'` za klasičan reverse-proxy)
- `CORS_CREDENTIALS` — `'true'|'false'`: dopušta `credentials` u CORS-u (koristi s allowlist originima, ne sa `*`)
- `DOCS_BASIC_AUTH` — `user:pass` za Basic auth zaštitu `/api/docs` i `/api/openapi.yaml`
- `API_RATE_LIMIT_ENABLE` — `'true'|'false'`: uključuje globalni rate-limit za `/api/*` (health/metrics/status su izuzeti)
- `API_RATE_LIMIT_WINDOW_MS` — prozor u ms (default 60000)
- `API_RATE_LIMIT_LIMIT` — broj zahtjeva po prozoru (default 300)
- `EXPOSE_HEADERS` — CSV popis headera izloženih prema browseru (default `X-Request-Id,X-Correlation-Id,Server-Timing,RateLimit-*`)

- `URLENCODED_LIMIT` — limit za x-www-form-urlencoded tijela (default 100kb)

- `DISABLE_ETAG` — gasi ETag na API odgovorima (default true)

- `TIMING_ALLOW_ORIGIN` — vrijednost za Timing-Allow-Origin (default *)

- `API_CACHE_CONTROL` — default Cache-Control za /api/* odgovore (default no-store)

- `SERVER_KEEPALIVE_TIMEOUT_MS` — keep-alive timeout (default 60000)

- `SERVER_HEADERS_TIMEOUT_MS` — headers timeout (default 65000)

- `SERVER_REQUEST_TIMEOUT_MS` — request timeout (default 120000)
- `DRAIN_TIMEOUT_MS` — koliko dugo držati draining prije gašenja (default 15000ms)
- `API_VERSION` — verzija koja se šalje u headeru `X-API-Version` (fallback na `GIT_SHA`)

- `STRICT_ACCEPT_JSON` — `'true'|'false'`: ako je `true`, zahtjevi s `Accept` bez `application/json` dobivaju 406

- `STRICT_JSON_PARSER` — `'true'|'false'`: strogi JSON parser (default `true`)

- `ENABLE_IDEMPOTENCY_GUARD` — `'true'|'false'`: uključuje Idempotency-Key guard za POST/PUT/PATCH/DELETE

- `IDEMPOTENCY_TTL_MS` — trajanje ključa u memoriji (default 300000 ms)

- `AUTH_RATE_LIMIT_WINDOW_MS` — prozor za auth rate-limit (default 60000)

- `AUTH_RATE_LIMIT_LIMIT` — broj pokušaja po prozoru za auth (default 10)

- `QUERY_PARSER` — `'simple'|'extended'` parser za query string (default `simple` radi sigurnosti)

- `AUDIT_IGNORE_PATHS` — CSV prefiksi ruta koje se preskaču u audit logu (default `/api/healthz,/api/readiness,/api/metrics`)

- `SANITIZE_MAX_DEPTH` — maksimalna dubina sanitizacije objekata (default 6)

- `SERVER_MAX_HEADERS_COUNT` — max broj headera po zahtjevu (0 = ne dira postavku)

- `AUDIT_LOG_JSON` — `'true'|'false'`: JSONL izlaz audit loga (level, rid, method, path, status, ms, ip, ua)

- `JSON_SPACES` — broj razmaka u `res.json()` (default 0)

- `ENABLE_PATH_GUARD` — `'true'|'false'`: blokira putanje s `..` (default true)

- `AUDIT_SAMPLE_RATE` — [0..1]: frakcija zahtjeva koji se logiraju u audit (greške se uvijek logiraju)

- `MAX_QUERY_PARAMS` — maksimalni broj query parametara (default 200)

- `MAX_QUERY_PARAM_LENGTH` — maksimalna duljina pojedinog query parametra (default 2048)

- `MAX_QUERY_ARRAY_LENGTH` — maksimalan broj ponavljanja istog parametra (default 100)

- `MAX_JSON_KEYS` — maksimalni broj polja u JSON tijelu (rekurzivno, default 2000)

- `DEPRECATION` — vrijednost za `Deprecation` header (npr. `version="1"`)

- `SUNSET` — RFC 8594 datum/vrijeme za `Sunset` header (npr. `Wed, 31 Dec 2025 23:59:59 GMT`)

- `DEPRECATION_LINK` — URL dokumentacije (dodaje se u `Link: <...>; rel="deprecation"`)

- `STRICT_CONTENT_TYPE` — `'true'|'false'`: ograniči `/api` metode s tijelom na `ALLOWED_CONTENT_TYPES` (default false)

- `COOKIE_HARDENING` — `'true'|'false'`: ojača `Set-Cookie` (dodaje `HttpOnly`, `Secure`, `SameSite` ako nedostaju)

- `COOKIE_SAMESITE_DEFAULT` — default `SameSite` ako nije naveden (default `Lax`)

- `COLLECT_DEFAULT_METRICS` — `'true'|'false'`: uključuje prom-client `collectDefaultMetrics()` (default `true`)

- `PROBLEM_JSON_ERRORS` — `'true'|'false'`: vraća greške kao `application/problem+json` (npr. 400/500)

- `RESPONSE_JSON_MAX_BYTES` — maksimalna veličina JSON odgovora (B); 0 = isključeno. Na prekoračenje → 500 `{ error:'response_too_large' }`

- `ENABLE_X_REQUEST_START` — `'true'|'false'`: dodaje `X-Request-Start` (epoch ms) na svaki odgovor

- `ENFORCE_HTTPS` — `'true'|'false'`: preusmjerava HTTP → HTTPS (GET/HEAD 308), ostale metode vraćaju 400 `https_required`

- `HSTS_INCLUDE_SUBDOMAINS` — `'true'|'false'` za `includeSubDomains`

- `BLOCKED_UA_PATTERNS` — regex (case-insensitive) za blokadu User-Agentova (npr. `sqlmap|nikto|nmap|masscan`)

- `ENABLE_NEL` — `'true'|'false'`: dodaje NEL header i koristi Report-To grupu za network error logging

- `EXPOSE_CLIENT_IP` — `'true'|'false'`: izloži `X-Client-IP` (samo za dijagnostiku; koristi uz `TRUST_PROXY`)

- `COMPRESSION_LEVEL` — zlib razina (-1 do 9; -1=default)

- `COMPRESSION_THRESHOLD` — prag za kompresiju (npr. `1kb`)

- `JSON_BIGINT_STRINGS` — `'true'|'false'`: serializira `BigInt` kao string u JSON odgovoru

- `RATE_LIMIT_ALLOWLIST` — CSV IP-ova koji se preskaču u rate-limiterima (global/auth)

- `ACCEPT_CLIENT_REQUEST_ID` — `'true'|'false'`: prihvati i koristi dolazni `X-Request-Id` (sanitiziran, max 128)

- `MAX_INFLIGHT_REQUESTS` — maksimalni broj istovremenih zahtjeva prije `503 server_busy` (0=isključeno)
