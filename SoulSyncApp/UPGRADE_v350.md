# v350 Enhancements
- Circuit breaker wrapper + wired atop HTTP client for push/webhook calls.
- Prisma model `F0Audit` + DB logger wired into F₀ engine (alongside NDJSON).
- Safe-gate enforcement helper clamps AI-influenced `f0_score` to threshold.
- Contract test generator now optionally hits live endpoints if `CONTRACT_BASE_URL` is set (safe subset).
- CSP env directives available.
