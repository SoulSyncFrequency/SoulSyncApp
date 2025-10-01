# Admin Ops Dashboard
- Staticki HTML: `public/admin_ops.html` (client-side fetch).
- Zaštićena ruta: `GET /admin/ops-dashboard` (RBAC) poslužuje stranicu.
- Prikazuje /ops/status (+ anomalyHints), /ops/anomaly-hints, /ops/release-notes, /ops/rl-proposal i nudi quick akcije (self-test, notify).
