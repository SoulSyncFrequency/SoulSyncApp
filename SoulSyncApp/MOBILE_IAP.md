# Mobile IAP (RevenueCat) – Skeleton

- Aplikacija (iOS/Android) koristi native IAP; RevenueCat agregira i šalje entitlements.
- Backend ruta: `POST /api/revenuecat/sync` prima `{ userId }` i osvježava entitlement preko RevenueCat API-ja.
- Env:
  - `REVENUECAT_SECRET` – Project secret API key
  - `REVENUECAT_PROJECT_ID` – (opcionalno) ID projekta

**Kako koristiti**
1. Nakon uspješne kupnje u appu, pozovi `/api/revenuecat/sync` s `userId` (isti app user ID kao u RC).
2. Backend može upisati `active=true` preko `setActive(userId, true)` ako RC kaže da je aktivan.
3. Terapijske rute su zaštićene `requireEntitlement`; ako korisnik nema aktivan entitlement i potrošio je free credit, dobije `402` i front ga vodi na `/paywall`.
