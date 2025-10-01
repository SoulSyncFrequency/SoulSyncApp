# Google Play – Submission Checklist (Server/Backend Items)

## Data safety form (guide)
- [ ] Declare categories collected (analytics, crash logs, account info if any).
- [ ] Purpose (app functionality, analytics, fraud prevention).
- [ ] Data handling (encryption in transit; deletion policy; optional user request delete).
- [ ] Third parties (e.g., Sentry/analytics) if configured.

## Privacy
- [ ] Privacy Policy URL live (HTTPS) and consistent.
- [ ] Remove any unnecessary logging of personal data.

## Security & Stability
- [ ] HTTPS only; HSTS.
- [ ] CSRF on admin POST; auth on admin routes.
- [ ] Rate limits for `/api`, `/api/docs`, `/metrics`.
- [ ] Observability: Prometheus+Grafana; alerts configured.

## Review Notes
- [ ] Provide testing credentials if needed.
- [ ] Document server regions and data residency if asked.
