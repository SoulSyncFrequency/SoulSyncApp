# Security Practices
- Turn on **HSTS** after HTTPS is fully configured: `FORCE_HSTS=true`.
- Use **CodeQL** and **Gitleaks** (already added in workflows).
- Keep **CSP** in report-only do QA; potom `CSP_REPORT_ONLY=false` + `report-uri`.
- Admin routes protected via `adminAuth` (hash+scope+expiry).
