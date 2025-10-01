# Ops Status
- `GET /ops/status` vraća `{ ok, version, flags, now }` za brzu dijagnostiku bez auth-a.
- Za detaljne flagove koristi `GET /ops/flags` (admin).
