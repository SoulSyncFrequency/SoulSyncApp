

---

## Icon & Splash Generation (Platinum)
- Generate PNGs from brand SVG:
  ```bash
  cd ops/brands
  npm install
  node render_png_from_svg.js out png
  ```
- Apply to native projects:
  ```bash
  ./ops/mobile/apply_assets.sh ops/brands/png ios/App/App android/app/src/main/res
  ```
- Populates:
  - Android mipmap-mdpi…xxxhdpi/ic_launcher.png
  - iOS AppIcon.appiconset/*.png + Splash.imageset/*.png
