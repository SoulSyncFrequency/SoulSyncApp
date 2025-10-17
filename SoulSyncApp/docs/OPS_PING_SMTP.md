# /ops/ping-smtp
- **GET /ops/ping-smtp** → `204` ako je SMTP konfiguriran i dostupno (`transporter.verify()`), inače `503` s error JSON-om.
- Error `smtp_not_configured` ako nije postavljen `SMTP_URL`.
- Korisno za health check mail sloja.
