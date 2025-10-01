# /ops/slo-status
- Računa `errorRate`, `p95`, `p99` iz `logs/access.ndjson` u zadanom prozoru (`?window=5m|15m|60m`).
- Uspoređuje s ciljevima (default: `errRate ≤ 1%`, `p95 ≤ 500 ms`, `p99 ≤ 1500 ms`) i vraća `ok`.
- Koristi se u post-deploy verifikaciji i kontinuiranom praćenju.
