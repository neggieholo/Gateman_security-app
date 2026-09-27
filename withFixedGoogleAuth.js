const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withFixedGoogleAuth(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents += `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'com.google.android.gms:play-services-auth:21.3.0'
        }
    }
}
`;
    }
    return config;
  });
};