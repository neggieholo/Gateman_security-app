const { withDangerousMod, withXcodeProject, withPlugins } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// --- ANDROID CONFIGURATION ---
const withAndroidSounds = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resRawDir = path.join(projectRoot, "android/app/src/main/res/raw");

      if (!fs.existsSync(resRawDir)) {
        fs.mkdirSync(resRawDir, { recursive: true });
      }

      const srcDir = path.join(projectRoot, "native-assets");
      const files = ["zego_incoming.mp3", "zego_outgoing.mp3"];

      files.forEach((file) => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(resRawDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      });
      return config;
    },
  ]);
};


module.exports = (config) => withPlugins(config, [withAndroidSounds]);