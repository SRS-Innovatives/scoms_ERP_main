import { Platform } from 'react-native';

/**
 * Both mobile apps are served by the unified mobile gateway (scoms-app-backend,
 * default port 5005), which mounts Staff_backend's own routes untouched under
 * /api/v1/mobile/staff — same controllers, same DB, as the web app.
 * Android emulator reaches the host machine via 10.0.2.2, not localhost.
 * Override with a real LAN IP (e.g. http://192.168.1.20:5005) to test on a physical device.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:5005/api/v1/mobile/staff`;

export const ENVIRONMENT = __DEV__ ? 'development' : 'production';
