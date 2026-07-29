module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // REQUIRED for VisionCamera and Face Detection worklets
      // 'react-native-worklets-core/plugin',
      
      // Keep Reanimated at the VERY BOTTOM if you are using it
      'react-native-reanimated/plugin',
    ],
  };
};