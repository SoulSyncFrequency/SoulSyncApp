# App Store / Play Store Checklist (SoulSync)

## Identity & Branding
- [ ] Bundle ID: `com.soulsync.app` (Xcode targets + Capacitor config)
- [ ] App name matches: "SoulSync"
- [ ] Icons: iOS (all sizes), Android adaptive icon + 512×512 Play icon
- [ ] Splash screens prepared (Capacitor resources)

## iOS
- [ ] Info.plist privacy keys (Camera/FaceID/Photo/Notifications) — see `ios_info_plist_inserts.txt`
- [ ] Push notifications entitlements only if used
- [ ] App Tracking Transparency (if any tracking)
- [ ] Build with Xcode 16 / SDK iOS 18 target, minimum iOS as decided

## Android
- [ ] targetSdkVersion 34, minSdk per Capacitor 5 defaults
- [ ] Permissions review (Camera/Storage only if needed)
- [ ] Data Safety form matches actual behavior
- [ ] App Signing (Play) enabled

## Backend
- [ ] Health check `/healthz` public, `/metrics` gated or restricted
- [ ] Rate limiting in place (prod)
- [ ] CORS client origin restricted
- [ ] Sentry DSN set via env only in prod
- [ ] Admin endpoints gated (RBAC + basic auth in staging)

## Frontend
- [ ] Sentry source maps uploaded in CI
- [ ] i18n HR/EN complete for all visible strings
- [ ] Legal pages linked in app footer/menu

## CI/CD
- [ ] Release tagging and changelog auto-generated
- [ ] Codecov / CodeQL passing
- [ ] Render services deploy successfully (backend + static frontend)
