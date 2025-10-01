# Runbook: Progest-E Module
- Feature flag: `PROGESTE_FEATURE_ENABLED`
- QoS: per-key tier limiter + backpressure + idempotency on dose logging
- Admin: PATCH `/admin/supplements/progeste/plan/:planId/clinician-ok` (hash+scope+expiry required)
- Data model: SupplementPlan/SupplementDose; params JSON is validated at create time
- AI: optional summaries via `SUPPL_AI_SUMMARY_ENABLED` (always with disclaimer, schema-validated)
- Not medical advice. Any clinical decisioning must be external.
