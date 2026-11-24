/**
 * Optional-Module Enforcement Middleware
 *
 * Mirrors the frontend sidebar gating (IntituteAdmin_module_frontend/InstitutionContext)
 * on the server, so disabling a module for an institution in Super Admin actually stops
 * that module's API from working for the Institute Admin, Staff, and Student portals —
 * not just hides a nav link. Checked live on every request (not cached on the JWT) so a
 * Super Admin toggle takes effect immediately, without requiring the user to log out.
 */
const { BusinessRuleError } = require('../errors/customErrors');
const { getInstitutionEnabledModules } = require('../appModules/resolveAppModules');

const requireModule = (moduleKey) => async (req, res, next) => {
  try {
    if (!req.institutionId) {
      // Super Admin / platform-level requests with no bound tenant are not module-gated.
      return next();
    }

    // Cached per institution (shared/utils/hotCache.js) — dropped automatically whenever
    // the Institution / module-assignment tables are written, so a Super Admin toggle
    // still takes effect immediately in the same process.
    // Dual-path (Phase 1): resolves through the new registry only for an institution
    // that's been explicitly assigned into it AND only with MODULE_REGISTRY_ENABLED=true
    // — everyone else gets exactly the legacy resolveEnabledModules() behavior this
    // always called directly. See shared/moduleRegistry/resolveModules.js. The loader is
    // shared with the mobile app-module resolver so the two can never disagree.
    const enabled = await getInstitutionEnabledModules(req.institutionId);
    if (!enabled.includes(moduleKey)) {
      throw new BusinessRuleError(`This module is not enabled for your institution. Contact your Super Admin to activate it.`);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireModule;
