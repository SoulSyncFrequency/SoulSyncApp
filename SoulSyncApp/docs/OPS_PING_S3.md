# /ops/ping-s3
- **GET /ops/ping-s3** → `204` ako je `S3_BUCKET_URL` postavljen i HEAD odgovor dostupan; inače `503` s error JSON-om.
- Error `s3_not_configured` ako `S3_BUCKET_URL` nije postavljen.
- Pomaže health check-u storage sloja.
