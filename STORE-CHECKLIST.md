# SoulSync — Play/App Store Checklist

## ✅ Pre-build
- [ ] `frontend/.env.production` postavljen na produkcijski API (npr. `https://api.soulsync.app`)
- [ ] Backend online (health: `/api/health`), `JWT_SECRET` postavljen
- [ ] Privacy Policy URL javno dostupan (npr. `https://legal.soulsync.app/privacy-policy.html`)
- [ ] Testni account kreiran (register/login radi)

## 🧪 QA
- [ ] Login/Register → radi
- [ ] Therapy → generira plan i SMILES, prikazuje F₀
- [ ] Download PDF → radi
- [ ] Legal/Contact linkovi → rade
- [ ] Dark/Light mode → radi

## 📦 Android (Google Play)
- [ ] `npx cap add android` (samo prvi put)
- [ ] Android Studio → Build **.aab**
- [ ] App name, package id, ikone, splash
- [ ] Play Console listing: naslov, opis, screenshotovi, kategorija
- [ ] Privacy Policy URL dodan
- [ ] Internal testing track → upload AAB, dodaj testere

## 🍎 iOS (App Store)
- [ ] `npx cap add ios` (samo prvi put)
- [ ] Xcode → set bundle id, signing, capabilities
- [ ] Build **.ipa** (Archive → Distribute/App Store Connect)
- [ ] App Store listing: naslov, opis, screenshotovi, kategorija
- [ ] Privacy Policy URL dodan
- [ ] TestFlight internal → dodaš build i testere

## 🔒 Store compliance
- [ ] Ne prikuplja se osjetljivi PII bez dozvole
- [ ] Analytics (ako postoji) anonimiziran i naveden u Privacy Policyju
- [ ] Kontakt email vidljiv u aplikaciji i u store listingu

## 🚀 Launch
- [ ] Postavi produkcijski `VITE_API_BASE_URL`
- [ ] Bump verzije (npr. v22.5), rebuild & release notes
- [ ] Tagaj release u GitHubu i provjeri CI

