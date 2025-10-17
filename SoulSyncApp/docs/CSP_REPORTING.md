# CSP Reporting
- Endpoint: `POST /csp-report` accepts `application/csp-report` or JSON body.
- Stores reports to `logs/csp.ndjson` for later analysis.
- Keep `CSP_REPORT_ONLY=true` during QA; switch to `false` to enforce after fixing violations.
