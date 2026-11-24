import { Platform } from 'react-native';

/**
 * Where the app's API lives.
 *
 * Release builds → the production server. It is the same single Render service that runs the
 * web portals (server/server.js), which also serves /api/v1/mobile/* — see
 * scoms-app-backend/src/mobileRoutes.js. Set PRODUCTION_API_ORIGIN to that service's URL
 * (the same value as SCOMS_API_URL in Vercel) before building a release.
 *
 * Debug builds → the local mobile gateway (`npm run start:mobile`, port 5005), which mounts
 * Student_Backend's own routes untouched. The Android emulator reaches the host machine via
 * 10.0.2.2, not localhost; for a physical phone put your computer's LAN IP in DEV_HOST
 * (e.g. '192.168.1.20').
 */
export const PRODUCTION_API_ORIGIN = 'https://scoms-erp-main.onrender.com';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEV_API_ORIGIN = `http://${DEV_HOST}:5005`;

export const ENVIRONMENT = __DEV__ ? 'development' : 'production';

export const API_BASE_URL = `${__DEV__ ? DEV_API_ORIGIN : PRODUCTION_API_ORIGIN}/api/v1/mobile/student`;
