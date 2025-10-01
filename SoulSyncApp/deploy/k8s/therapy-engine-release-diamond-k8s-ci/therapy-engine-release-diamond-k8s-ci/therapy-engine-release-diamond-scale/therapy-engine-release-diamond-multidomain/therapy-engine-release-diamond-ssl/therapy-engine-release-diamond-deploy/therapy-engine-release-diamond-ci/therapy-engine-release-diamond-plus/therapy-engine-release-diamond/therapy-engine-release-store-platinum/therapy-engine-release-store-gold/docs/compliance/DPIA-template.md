# DPIA Template — TherapyEngine

**Controller:** Your Company  
**Processor(s):** Hosting provider(s), Sentry (telemetry), Stripe/RevenueCat (billing)  
**Purpose:** Provide wellness plan generation and reminders.  
**Lawful basis:** Consent / Legitimate interest (depending on feature).  
**Data categories:** Email, questionnaire answers, therapy outputs, device tokens (push), crash/perf telemetry.

## Processing Flow
1. User registers/logs in (email; optional OAuth).
2. User submits prompt or questionnaire; server generates therapy.
3. Data stored encrypted (AES-GCM) when DATA_KEY set.
4. Optional push tokens stored for notifications.
5. Billing via Stripe/RevenueCat (subscription metadata).

## Risks & Mitigations
- Unauthorized access → RBAC, rate limits, 2FA option, encryption at rest.
- Data breach → telemetry minimal; access logs; backups encrypted.
- Profiling → No third-party ads; feature flags disabled per region where unlawful.

## Data Subject Rights
- Export: `/me/export`
- Erasure: `DELETE /me`
- Contact: privacy@yourdomain.tld

## Retention
- Accounts inactive > X months → anonymize or delete.
