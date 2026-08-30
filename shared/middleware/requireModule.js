/**
 * Optional-Module Enforcement Middleware
 *
 * Mirrors the frontend sidebar gating (IntituteAdmin_module_frontend/InstitutionContext)
 * on the server, so disabling a module for an institution in Super Admin actually stops
 * that module's API from working for the Institute Admin, Staff, and Student portals —
 * not just hides a nav link. Checked live on every request (not cached on the JWT) so a
 * Super Admin toggle takes effect immediately, without requiring the user to log out.
 */
const prisma = require('../database/client');
const { resolveEnabledModules } = require('../constants/institutionModules');
const { BusinessRuleError } = require('../errors/customErrors');

const requireModule = (moduleKey) => async (req, res, next) => {
  try {
    if (!req.institutionId) {
      // Super Admin / platform-level requests with no bound tenant are not module-gated.
      return next();
    }

    const institution = await prisma.institution.findUnique({
      where: { id: req.institutionId },
      select: { modules: true },
    });

    const enabled = resolveEnabledModules(institution?.modules);
    if (!enabled.includes(moduleKey)) {
      throw new BusinessRuleError(`This module is not enabled for your institution. Contact your Super Admin to activate it.`);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireModule;
