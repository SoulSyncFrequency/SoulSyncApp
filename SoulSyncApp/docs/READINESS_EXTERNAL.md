# External Readiness Checks (optional)
- SMTP: set `SMTP_HOST` (and optionally `SMTP_PORT`, default 587) to enable a TCP check.
- S3: set `S3_BUCKET_URL` (e.g., `https://bucket.s3.amazonaws.com/`) to enable a quick HEAD check.
- `/ready` will return `503 smtp_unavailable` or `503 s3_unavailable` if checks fail.
