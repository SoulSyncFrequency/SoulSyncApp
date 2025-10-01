# /admin/ops/notify (admin)
- **POST /admin/ops/notify** — pošalje testnu poruku preko konfiguriranih kanala (Slack/Discord/Email).
- Tijelo zahtjeva: `{ "subject": "Title", "body": "Message" }` — oba opcionalna.
- Zaštićeno `adminAuth` + RBAC.
