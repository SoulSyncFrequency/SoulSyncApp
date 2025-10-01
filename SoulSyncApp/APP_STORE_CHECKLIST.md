# Apple App Store – Submission Checklist (Server/Backend Items)

## Legal & Data
- [ ] Privacy Policy URL live and accessible (HTTPS), consistent with app behavior.
- [ ] Terms of Service URL (optional but recommended).
- [ ] Data Collection: verify what is collected/transmitted; update policy accordingly.

## Networking & Security
- [ ] All endpoints over HTTPS; HSTS enabled.
- [ ] CSP enabled; no mixed content.
- [ ] Rate limiting present on admin/docs/metrics/api.
- [ ] Authentication for admin features; no hardcoded credentials.

## Stability
- [ ] Health/readiness endpoints live (`/healthz`, `/readyz`).
- [ ] Metrics available (locked by token or not publicly discoverable).
- [ ] Logs/alerts monitored; on-call contact established.

## Review Notes
- [ ] Provide reviewer account/token if required.
- [ ] Include steps to reproduce main features.
