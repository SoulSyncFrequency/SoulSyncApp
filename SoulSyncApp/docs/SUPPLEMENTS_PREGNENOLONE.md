# Pregnenolone Module
- Feature flag: `PREGNENOLONE_FEATURE_ENABLED` (default true).
- Endpoints: create plan, consent, log dose (idempotency + backpressure), list (paginated), summary (+optional AI text).
- Data model: reuses `SupplementPlan`/`SupplementDose` with type `PREGNENOLONE`.
- Safety: informational only; **not** medical advice. Activation requires consent; `clinicianOk` field available for future gating.
