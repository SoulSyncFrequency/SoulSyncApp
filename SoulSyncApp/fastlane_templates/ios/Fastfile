default_platform(:ios)
platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    build_app(scheme: "App", export_method: "app-store")
    upload_to_testflight
  end
  desc "Build for App Store"
  lane :release do
    build_app(scheme: "App", export_method: "app-store")
    upload_to_app_store
  end
end
