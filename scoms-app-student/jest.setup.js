/* Jest: native modules have no JS implementation under Node — mock them so the whole app
 * (App.test.tsx) can render. Logic tests mock their own screens and don't need this. */
/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

// in-memory AsyncStorage (the package's own jest mock isn't shipped in every version)
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const api = {
    getItem: jest.fn((k) => Promise.resolve(store.has(k) ? store.get(k) : null)),
    setItem: jest.fn(async (k, v) => {
      store.set(k, v);
    }),
    removeItem: jest.fn(async (k) => {
      store.delete(k);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
    getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
    multiRemove: jest.fn(async (keys) => {
      keys.forEach((k) => store.delete(k));
    }),
  };
  return { __esModule: true, default: api, ...api };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: {},
}));

jest.mock('@react-native-firebase/app', () => ({ getApp: jest.fn(() => ({})) }));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('test-token')),
  requestPermission: jest.fn(() => Promise.resolve(1)),
  onTokenRefresh: jest.fn(() => () => {}),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('react-native-razorpay', () => ({ open: jest.fn() }), { virtual: true });
