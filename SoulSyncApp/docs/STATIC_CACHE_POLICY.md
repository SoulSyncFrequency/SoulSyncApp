# Static Cache Policy
- Fingerprinted assets (`/assets/**.[hash].js|css`) → `Cache-Control: public, max-age=31536000, immutable`.
- Non-fingerprinted under `/assets|/static` → `Cache-Control: public, max-age=300`.
- API ostaje `no-store` (kako je već podešeno).
