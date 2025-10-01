# Deployment & Submission Guide

## Backend (Docker)
- Copy `.env.example` to `.env` and fill values (DATABASE_URL, JWT_SECRET, STRIPE_KEY, REVENUECAT_KEY, ...).
- Run: `docker-compose -f ops/docker-compose.prod.yml up -d`

## Database migrations (Prisma)
- Install: `npm install prisma --save-dev`
- Run migration: `npx prisma migrate dev --name init`
- Apply in prod: `npx prisma migrate deploy`

## Frontend
- Build: `npm run build`
- Preview: `npm run preview`

## iOS Build
```
cd ios/App
pod install
npx cap sync ios
npx cap open ios
# Xcode → Product → Archive → Distribute App Store
```

## Android Build
```
cd android
./gradlew bundleRelease
# Generates .aab for Play Console
```

## Store listing
- Texts: `ops/store/metadata.json`
- Icons/Splash: generate with `ops/brands/render_png_from_svg.js` + apply with `ops/mobile/apply_assets.sh`
- Privacy labels: `store/apple_privacy_labels.md`, `store/google_data_safety.json`
