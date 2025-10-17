# Smart Improvements 2.0

1. **TypeScript safety++**: enable `noUncheckedIndexedAccess` in both frontend and backend `tsconfig.json` for stronger typing.
2. **Strict env validation**: add `backend/src/config.ts` using Zod to validate required env vars at startup; auto-generate `CONFIG_VALIDATION.md`.
3. **HTTP response schemas**: add Zod for response validation for public endpoints; generate types for frontend automatically.
4. **Rate-limit tuning**: set different limits for `/auth`, `/verifier`, `/therapy` routes (already have limiter utils).
5. **E2E on device (mobile)**: add Detox or Maestro flows for core user journey (login → questionnaire → therapy PDF).
6. **Chunking & preloading (frontend)**: route-based code splitting and `<link rel="preload">` for critical assets to reduce TTI.
7. **Image pipeline**: vite-imagetools and responsive images for store-grade screenshots and faster first load.
8. **RBAC policies**: formalize roles/permissions in a single `rbac/policies.ts` with unit tests.
9. **Zero-downtime db migrations**: bake safe migrations in CI step before deploy hooks.
10. **SLOs & alerts**: RED metrics dashboards + alerting (latency, error rate, saturation) in Prometheus/Alertmanager.
