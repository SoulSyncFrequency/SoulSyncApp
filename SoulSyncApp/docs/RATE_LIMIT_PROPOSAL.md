# /ops/rl-proposal (advisory)
- Čita `logs/access.ndjson` i računa prosječnu latenciju, max i 5xx udio.
- Heuristika predlaže: `keep`, `tighten_window_10pct` ili `loosen_window_10pct`.
- **Ne mijenja konfiguraciju** — informativno za SRE/ops.
