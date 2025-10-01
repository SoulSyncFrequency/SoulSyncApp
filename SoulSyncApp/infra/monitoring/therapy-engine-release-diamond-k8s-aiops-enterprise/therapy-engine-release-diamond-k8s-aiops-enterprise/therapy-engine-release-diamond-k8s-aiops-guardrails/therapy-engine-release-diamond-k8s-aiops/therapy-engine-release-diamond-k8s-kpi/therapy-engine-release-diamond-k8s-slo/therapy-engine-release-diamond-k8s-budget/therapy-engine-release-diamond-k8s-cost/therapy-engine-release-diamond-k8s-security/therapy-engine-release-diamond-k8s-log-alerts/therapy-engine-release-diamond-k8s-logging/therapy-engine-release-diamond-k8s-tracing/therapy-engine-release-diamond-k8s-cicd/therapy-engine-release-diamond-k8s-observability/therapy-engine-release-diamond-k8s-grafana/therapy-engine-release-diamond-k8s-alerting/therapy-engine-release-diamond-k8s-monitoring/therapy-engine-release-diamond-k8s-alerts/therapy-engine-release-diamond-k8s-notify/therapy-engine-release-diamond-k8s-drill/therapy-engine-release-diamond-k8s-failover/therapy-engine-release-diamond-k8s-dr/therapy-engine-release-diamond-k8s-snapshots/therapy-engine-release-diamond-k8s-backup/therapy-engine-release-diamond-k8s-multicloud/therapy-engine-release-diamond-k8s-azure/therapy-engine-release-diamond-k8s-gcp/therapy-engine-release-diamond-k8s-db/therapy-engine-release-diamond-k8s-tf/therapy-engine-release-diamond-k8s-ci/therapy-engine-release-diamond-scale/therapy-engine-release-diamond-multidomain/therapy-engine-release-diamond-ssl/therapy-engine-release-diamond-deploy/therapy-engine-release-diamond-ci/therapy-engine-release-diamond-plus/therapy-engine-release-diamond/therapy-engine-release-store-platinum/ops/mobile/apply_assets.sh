#!/usr/bin/env bash
set -euo pipefail
SRC_DIR="${1:-ops/brands/png}"
IOS_APP="${2:-ios/App/App}"
ANDROID_APP="${3:-android/app/src/main/res}"

mkdir -p "$ANDROID_APP/mipmap-mdpi" "$ANDROID_APP/mipmap-hdpi" "$ANDROID_APP/mipmap-xhdpi" "$ANDROID_APP/mipmap-xxhdpi" "$ANDROID_APP/mipmap-xxxhdpi"
cp "$SRC_DIR/"*-android-mdpi.png "$ANDROID_APP/mipmap-mdpi/ic_launcher.png" || true
cp "$SRC_DIR/"*-android-hdpi.png "$ANDROID_APP/mipmap-hdpi/ic_launcher.png" || true
cp "$SRC_DIR/"*-android-xhdpi.png "$ANDROID_APP/mipmap-xhdpi/ic_launcher.png" || true
cp "$SRC_DIR/"*-android-xxhdpi.png "$ANDROID_APP/mipmap-xxhdpi/ic_launcher.png" || true
cp "$SRC_DIR/"*-android-xxxhdpi.png "$ANDROID_APP/mipmap-xxxhdpi/ic_launcher.png" || true

ICONSET="$IOS_APP/Assets.xcassets/AppIcon.appiconset"
mkdir -p "$ICONSET"
cp "$SRC_DIR/"*-ios-*.png "$ICONSET/" || true

SPLASHSET="$IOS_APP/Assets.xcassets/Splash.imageset"
mkdir -p "$SPLASHSET"
cp "$SRC_DIR/"*-splash-*.png "$SPLASHSET/" || true

echo "Assets applied to iOS ($ICONSET, $SPLASHSET) and Android ($ANDROID_APP)."
