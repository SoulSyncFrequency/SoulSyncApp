# /ops/top-errors
- Agregira najčešće **error signature** vrijednosti iz `logs/access.ndjson` u zadanom prozoru (`?window=...`).
- Signature je kombinacija `status` + `error_code` (ako postoji). Također vraća rute s najviše errora.
