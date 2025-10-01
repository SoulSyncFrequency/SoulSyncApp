# Ops Maintenance API (admin)
- `POST /admin/ops/log-retention` — pokreće `backend/scripts/log_retention.py` i vraća stdout/stderr.
- `POST /admin/ops/csp-analyze` — pokreće `backend/scripts/csp_analyze.py` i vraća stdout/stderr.
- Zaštićeno `adminAuth` + RBAC.
