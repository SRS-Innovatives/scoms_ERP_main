/**
 * Everything the two mobile apps call, as ONE router — mounted by:
 *   - scoms-app-backend/src/app.js  (the standalone gateway, `npm run start:mobile`, port 5005)
 *   - server/app.js                 (the combined production server on Render)
 * so production serves /api/v1/mobile/* from the same single service as the web portals.
 *
 * It reuses Student_Backend's and Staff_backend's own routers unchanged (same controllers,
 * auth, RBAC and tenant scoping as the web portals) and adds only the mobile layers: the
 * maintenance / "mobile apps" feature switch, Super Admin's App Module Access, push device
 * tokens, and /app-modules.
 */
const express = require('express');

const studentRoutes = require('../../Student_Backend/src/routes/apiRoutes');
const staffRoutes = require('../../Staff_backend/src/routes/apiRoutes');
const pushNotificationRoutes = require('./modules/pushNotifications');
const internalPushRoutes = require('./modules/pushNotifications/internalRoutes');
const { dispatchToUsers } = require('./modules/pushNotifications/service');
const appModuleRoutes = require('./modules/appModules');
const { requireAppModule } = require('../../shared/appModules');
const { blockDuringMaintenance } = require('../../shared/middleware/maintenanceMode');
const { isFeatureOn } = require('../../shared/utils/featureFlags');
const { setLocalPushDispatcher } = require('../../shared/utils/notificationCenter');

// This process can send pushes itself — notifications written by ANY router in the same
// process (web portals included, in the combined server) are delivered directly instead of
// via an HTTP call to /internal/push.
setLocalPushDispatcher(dispatchToUsers);

const MOBILE = ['/api/v1/mobile/student', '/api/v1/mobile/staff'];
const router = express.Router();

// Platform Maintenance Mode (Super Admin → System) — 503 while it is on
router.use(MOBILE, blockDuringMaintenance);
// Feature Flag "Mobile apps access" (Super Admin) — off: the apps are told to use the website
router.use(MOBILE, async (req, res, next) => {
  if (req.method === 'OPTIONS' || (await isFeatureOn('mobile_apps'))) return next();
  return res.status(503).json({ success: false, code: 'FEATURE_DISABLED', message: 'The SCOMS mobile app is temporarily unavailable. Please use the website for now.' });
});

// App Module Access (Super Admin) — a module hidden for this institution + role answers
// 403 APP_MODULE_HIDDEN here, before the reused router runs. Core paths pass untouched.
router.use('/api/v1/mobile/student', requireAppModule('STUDENT_APP'));
router.use('/api/v1/mobile/student', studentRoutes);
router.use('/api/v1/mobile/student', pushNotificationRoutes); // falls through here with req.user already set by studentRoutes' own requireAuth
router.use('/api/v1/mobile/student', appModuleRoutes.forApp('STUDENT_APP')); // same fall-through
router.use('/api/v1/mobile/staff', requireAppModule('STAFF_APP'));
router.use('/api/v1/mobile/staff', staffRoutes);
router.use('/api/v1/mobile/staff', pushNotificationRoutes); // same router, mounted a second time under the staff prefix
router.use('/api/v1/mobile/staff', appModuleRoutes.forApp('STAFF_APP'));

// Server-to-server only (secret-header authenticated) — for backends running in OTHER
// processes (e.g. the per-portal dev servers) to ask this one to deliver a push.
router.use('/internal/push', internalPushRoutes);

module.exports = router;
