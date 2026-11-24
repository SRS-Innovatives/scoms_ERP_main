module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // These packages ship untranspiled ES modules — let babel transform them
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-vector-icons|@react-native-firebase|@react-native-async-storage|react-native-keychain|react-native-razorpay)/)',
  ],
};
