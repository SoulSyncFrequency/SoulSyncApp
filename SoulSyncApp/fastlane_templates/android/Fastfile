default_platform(:android)
platform :android do
  desc "Build AAB for release"
  lane :build do
    gradle(task: "bundle", build_type: "Release")
  end
  desc "Upload to Play (requires supply config)"
  lane :publish do
    supply(track: "production", aab: "app/build/outputs/bundle/release/app-release.aab")
  end
end
