# Native Projects (Capacitor)
1) From repo root:
   ```bash
   cd frontend
   npm ci
   npm run build
   npx cap sync
   npx cap add ios
   npx cap add android
   ```
2) Copy icons/splash from `store/assets/` into the appropriate platforms or use `capacitor-assets`:
   ```bash
   npm i -D @capacitor/assets
   npx capacitor-assets generate --iconBackgroundColor "#111827" --splashBackgroundColor "#0f172a"
   ```
3) Open projects:
   ```bash
   npx cap open ios
   npx cap open android
   ```
