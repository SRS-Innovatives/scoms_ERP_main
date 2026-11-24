/**
 * GET <app prefix>/app-modules — which app modules the logged-in user sees in this app
 * (Super Admin → Institutions → App Module Access, combined with the institution's own
 * enabled modules and the role). The app builds its tabs, More menu and dashboard
 * widgets from this list.
 *
 * Mounted like pushNotifications: after the reused Student/Staff router at the same
 * prefix, so req.user is already set by that router's own requireAuth.
 */
const express = require('express');
const { sendSuccess, appModules } = require('@scoms/shared');

const forApp = (appKey) => {
  const router = express.Router();
  router.get('/app-modules', async (req, res, next) => {
    try {
      const modules = await appModules.resolveAppModules({
        institutionId: req.user.institutionId,
        appKey,
        role: req.user.role,
      });
      return sendSuccess(res, { app: appKey, role: req.user.role, modules }, 'App modules retrieved');
    } catch (err) {
      next(err);
    }
  });
  return router;
};

module.exports = { forApp };
