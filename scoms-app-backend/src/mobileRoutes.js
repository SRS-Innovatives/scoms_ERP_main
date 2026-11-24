/**
 * Everything the two mobile apps call. Production runs ONE Render service per portal, so each
 * app's API lives inside its own portal's backend:
 *
 *   mobileRouterFor('student') → Student_Backend/src/app.js   (/api/v1/mobile/student/*)
 *   mobileRouterFor('staff')   → Staff_backend/src/app.js     (/api/v1/mobile/staff/*)
 *   module.exports (both + /internal/push) → the standalone gateway (scoms-app-backend,
 *       `npm run start:mobile`, port 5005) and the combined server (server/app.js)
 *
 * It reuses Student_Backend's and Staff_backend's own routers unchanged (same controllers,
 * auth, RBAC and tenant scoping as the web portals) and adds only the mobile layers: the
 * maintenance / "mobile apps" feature switch, Super Admin's App Module Access, push device
 * tokens, and /app-modules.
 */
const express = require('express');

const pushNotificationRoutes = require('./modules/pushNotifications');
const internalPushRoutes = require('./modules/pushNotifications/internalRoutes');
const { dispatchToUsers } = require('./modules/pushNotifications/service');
const appModuleRoutes = require('./modules/appModules');
const { requireAppModule } = require('../../shared/appModules');
const { blockDuringMaintenance } = require('../../shared/middleware/maintenanceMode');
const { isFeatureOn } = require('../../shared/utils/featureFlags');
const { setLocalPushDispatcher } = require('../../shared/utils/notificationCenter');

/**
 * Deliver pushes from THIS process: notifications written by any router here (web portal
 * or mobile) reach phones directly — no HTTP call to /internal/push, no shared secret.
 * Every backend calls this (the Institute Admin and Super Admin backends too, so their
 * circulars / announcements push as well). Real sends need FIREBASE_SERVICE_ACCOUNT_JSON;
 * without it pushes are simulated (logged).
 */
const enableLocalPush = () => setLocalPushDispatcher(dispatchToUsers);

const APPS = {
  student: { prefix: '/api/v1/mobile/student', appKey: 'STUDENT_APP', routes: () => require('../../Student_Backend/src/routes/apiRoutes') },
  staff: { prefix: '/api/v1/mobile/staff', appKey: 'STAFF_APP', routes: () => require('../../Staff_backend/src/routes/apiRoutes') },
};

/** The /api/v1/mobile/<app>/* router for ONE app. */
const mobileRouterFor = (name) => {
  const a = APPS[name];
  if (!a) throw new Error(`Unknown mobile app "${name}"`);
  enableLocalPush();
  const router = express.Router();
  // Platform Maintenance Mode (Super Admin → System) — 503 while it is on
  router.use(a.prefix, blockDuringMaintenance);
  // Feature Flag "Mobile apps access" (Super Admin) — off: the apps are told to use the website
  router.use(a.prefix, async (req, res, next) => {
    if (req.method === 'OPTIONS' || (await isFeatureOn('mobile_apps'))) return next();
    return res.status(503).json({ success: false, code: 'FEATURE_DISABLED', message: 'The SCOMS mobile app is temporarily unavailable. Please use the website for now.' });
  });
  // App Module Access (Super Admin) — a module hidden for this institution + role answers
  // 403 APP_MODULE_HIDDEN here, before the reused router runs. Core paths pass untouched.
  router.use(a.prefix, requireAppModule(a.appKey));
  router.use(a.prefix, a.routes());
  router.use(a.prefix, pushNotificationRoutes); // falls through here with req.user already set by the portal router's own requireAuth
  router.use(a.prefix, appModuleRoutes.forApp(a.appKey)); // same fall-through
  return router;
};

/** Both apps + the server-to-server push route (for backends in OTHER processes, e.g. the
 * per-portal dev servers). Built on request, so requiring this file inside the Student
 * backend never loads the Staff routes (and vice versa). */
const combinedMobileRouter = () => {
  const router = express.Router();
  router.use(mobileRouterFor('student'));
  router.use(mobileRouterFor('staff'));
  router.use('/internal/push', internalPushRoutes);
  return router;
};

module.exports = { mobileRouterFor, combinedMobileRouter, enableLocalPush };
