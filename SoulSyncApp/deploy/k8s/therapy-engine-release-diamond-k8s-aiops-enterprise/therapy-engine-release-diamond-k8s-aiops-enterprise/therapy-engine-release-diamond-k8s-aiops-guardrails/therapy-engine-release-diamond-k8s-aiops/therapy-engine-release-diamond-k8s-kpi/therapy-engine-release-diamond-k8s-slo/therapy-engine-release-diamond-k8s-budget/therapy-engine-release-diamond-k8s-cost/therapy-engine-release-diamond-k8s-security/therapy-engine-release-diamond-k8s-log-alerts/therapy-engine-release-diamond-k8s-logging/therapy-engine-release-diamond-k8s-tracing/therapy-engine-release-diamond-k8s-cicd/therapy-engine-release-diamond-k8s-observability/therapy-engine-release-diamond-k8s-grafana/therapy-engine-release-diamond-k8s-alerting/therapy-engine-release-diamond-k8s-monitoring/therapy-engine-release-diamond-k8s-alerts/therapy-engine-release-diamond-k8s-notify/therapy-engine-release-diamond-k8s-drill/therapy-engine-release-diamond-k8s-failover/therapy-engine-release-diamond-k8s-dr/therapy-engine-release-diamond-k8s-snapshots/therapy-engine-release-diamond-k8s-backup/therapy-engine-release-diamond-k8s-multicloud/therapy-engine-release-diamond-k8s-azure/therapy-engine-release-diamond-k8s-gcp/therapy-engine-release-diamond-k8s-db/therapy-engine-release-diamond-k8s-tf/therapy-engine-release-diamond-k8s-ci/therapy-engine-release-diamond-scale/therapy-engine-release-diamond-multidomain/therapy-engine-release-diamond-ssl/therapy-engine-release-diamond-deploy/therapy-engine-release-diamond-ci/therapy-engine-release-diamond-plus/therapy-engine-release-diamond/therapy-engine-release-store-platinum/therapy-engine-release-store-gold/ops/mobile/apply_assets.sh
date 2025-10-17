#!/usr/bin/env bash
# Copy generated PNGs into Android/iOS projects (paths may vary with your setup).
set -euo pipefail
SRC_DIR="${1:-ops/brands/png}"
IOS_APP="${2:-ios/App/App}"
ANDROID_APP="${3:-android/app/src/main/res}"

# Android mipmaps (using 192 base for xxxhdpi)
mkdir -p "$ANDROID_APP/mipmap-xxxhdpi" "$ANDROID_APP/mipmap-xxhdpi" "$ANDROID_APP/mipmap-xhdpi" "$ANDROID_APP/mipmap-hdpi" "$ANDROID_APP/mipmap-mdpi"
cp "$SRC_DIR/"*1024.png "$ANDROID_APP/mipmap-xxxhdpi/ic_launcher.png" || true
cp "$SRC_DIR/"*512.png "$ANDROID_APP/mipmap-xxhdpi/ic_launcher.png" || true
cp "$SRC_DIR/"*192.png "$ANDROID_APP/mipmap-xhdpi/ic_launcher.png" || true

# iOS expects AppIcon.appiconset — consider using @capacitor/assets to generate full set.
echo "Tip: Use 'npx capacitor-assets generate' for full iOS/Android sets."
