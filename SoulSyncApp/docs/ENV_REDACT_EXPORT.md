# /ops/env/redact-export
- Vraća JSON snapshot odabranih ENV ključeva. Lista se kontrolira preko `OPS_ENV_EXPORT_KEYS` (comma-separated).
- Ključevi koji izgledaju kao tajne (`*key*`, `*token*`, `*secret*`, `*password*`, ...) automatski se **redaktiraju**.
- Primjer outputa: `{ env: { NODE_ENV: "production", OPS_ALERT_TOKEN: "sec***n" } }`.
