# CSP Enforce Readiness
- Run `python backend/scripts/csp_analyze.py` to see top violations from `logs/csp.ndjson`.
- Fix or whitelist expected sources. When the list is clean for a few days, set:
  - `CSP_REPORT_ONLY=false`
- `report-uri` already points to `/csp-report` (backend collector enabled).
