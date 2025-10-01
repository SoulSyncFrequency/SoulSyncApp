# Unified Platform Build

Set platform in env:
- Backend: `APP_PLATFORM=store` (Play/App Store via RevenueCat) or `APP_PLATFORM=web` (Stripe)
- Frontend: `VITE_APP_PLATFORM=store|web`

## Store build (recommended for Play/App Store)
- `APP_PLATFORM=store`
- `VITE_APP_PLATFORM=store`
- Stripe routes are **disabled**
- Use native IAP (RevenueCat SDK); after purchase call `/api/revenuecat/sync`

## Web build (Render/GitHub later)
- `APP_PLATFORM=web`
- `VITE_APP_PLATFORM=web`
- Paywall uses Stripe Hosted Checkout (`/api/billing/create-checkout-session`)


## CI matrix
- Workflow `build-matrix.yml` gradi oba moda: `store` i `web`.
- Postavi tajne (ako treba build backend/testovi s RC/Stripe) u repo Secrets: `REVENUECAT_SECRET`, `STRIPE_*`.
