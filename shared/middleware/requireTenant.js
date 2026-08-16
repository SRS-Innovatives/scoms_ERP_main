/**
 * Multi-Tenant Isolation Enforcement Middleware
 * Ensures institution context is strictly bound to the authenticated user's JWT session.
 */

const { ROLES } = require('../constants/roles');
const { AuthorizationError } = require('../errors/customErrors');

const requireTenant = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthorizationError('Authentication context required for tenant validation');
    }

    // Super Admin platform level access bypasses tenant restriction
    if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.PLATFORM_ADMIN) {
      // If super admin specifies an institutionId in header, use it as scope
      const headerInstId = req.headers['x-institution-id'];
      req.institutionId = headerInstId || req.user.institutionId || null;
      return next();
    }

    if (!req.user.institutionId) {
      throw new AuthorizationError('User account is not bound to a valid institution tenant');
    }

    // Bind institutionId context to request object strictly from user session
    req.institutionId = req.user.institutionId;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireTenant;
