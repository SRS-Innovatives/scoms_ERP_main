/**
 * Mobile gateway middleware: blocks API calls that belong to an app module Super Admin
 * has hidden for the caller's institution + role (Institutions → App Module Access).
 *
 * Mounted on the gateway BEFORE the reused Student/Staff routers, so it authenticates the
 * request itself (shared requireAuth — the router re-checks it anyway). Paths that no
 * catalog module claims are core and pass straight through without any lookup, and so
 * does any request with no bearer token: the router behind this answers those with its
 * normal 401, exactly as before.
 *
 * This only ever ADDS a restriction for mobile clients. The web portals never pass through
 * it, and the institution-level requireModule() checks inside the routers are unchanged.
 */
const requireAuth = require('../middleware/requireAuth');
const { AppError } = require('../errors/customErrors');
const { findModuleForPath } = require('./catalog');
const { isAppModuleVisible } = require('./resolveAppModules');

const requireAppModule = (appKey) => (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const mod = findModuleForPath(appKey, req.path);
  if (!mod) return next(); // core path
  if (!req.headers.authorization) return next(); // let the router produce its own 401

  return requireAuth(req, res, async (authErr) => {
    if (authErr) return next(authErr);
    try {
      const visible = await isAppModuleVisible({
        institutionId: req.user.institutionId,
        appKey,
        role: req.user.role,
        moduleKey: mod.key,
      });
      if (!visible) {
        return next(new AppError(`${mod.label} is not available in the app for your institution.`, 403, 'APP_MODULE_HIDDEN'));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  });
};

module.exports = requireAppModule;
