# In-App Purchases (Skeleton)
- Use platform-native IAP plugins (e.g., `capacitor-storekit` for iOS, `capacitor-play-billing` for Android) or a cross-platform layer.
- Products: `premium_monthly` / `premium_yearly`.
- On successful purchase, call backend to mark subscription active (or validate server-side receipt and set status).
- For server verification, add endpoints to accept receipt and validate with Apple/Google servers.
