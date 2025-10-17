# /ops/rl-dryrun
- Heuristička simulacija za rate-limit: `action=keep|tighten|loosen`, `pct=10` (1–50), `window=...`.
- Procjenjuje `projected429` na temelju uzorka latencija i postojećih 429 odgovora. **Ne mijenja konfiguraciju.**
