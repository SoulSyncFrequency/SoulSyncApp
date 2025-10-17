# Webhook HMAC Verification
- Header: `x-signature: sha256=<hexdigest>`, body is verified using HMAC SHA-256.
- Configure via `WEBHOOK_SECRET` or `WEBHOOK_SECRETS='{"route":"secret"}'`.
- Example endpoint: `POST /webhooks/example` (uses raw text body, then optional JSON parse).
