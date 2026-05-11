const { execSync } = require('child_process');

const targetPath = "ios/Pods/AgoraRtm_iOS/AgoraRtmKit.xcframework/ios-arm64_armv7/AgoraRtmKit.framework/AgoraRtmKit";

try {
  console.log("🛠️  Starting manual Bitcode strip for Agora...");
  
  execSync(`xcrun bitcode_strip -r ${targetPath} -o ${targetPath}`);
  
  console.log("✅ Bitcode successfully stripped from AgoraRtmKit!");
} catch (error) {
  // If the path is wrong, we log a warning but don't stop the whole build
  console.warn("⚠️  Bitcode strip skipped. Path not found: " + targetPath);
  console.log("Inner Error: " + error.message);
}