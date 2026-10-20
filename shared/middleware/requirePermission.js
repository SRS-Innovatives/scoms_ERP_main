/**
 * Role & Permission Based Access Control (RBAC) Middleware
 */

const { hasPermission, hasPermissionAsync } = require('../permissions/permissionMatrix');
const { AuthorizationError } = require('../errors/customErrors');

const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new AuthorizationError('Authentication required');
      }

      if (!hasPermission(req.user.role, permission)) {
        throw new AuthorizationError(`Permission denied: '${permission}' required`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new AuthorizationError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError('Access denied for user role');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Always-enforced check that honours RolePermissionOverride (unlike requirePermission,
 * which reads only the static matrix, and shadowPermission, which only logs unless
 * RBAC_ENFORCEMENT_ENABLED is on). For new approval-type endpoints with no legacy traffic.
 */
const requirePermissionStrict = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new AuthorizationError('Authentication required');
      }
      const prisma = require('../database/client');
      if (!(await hasPermissionAsync(prisma, req.user.role, permission))) {
        throw new AuthorizationError(`Permission denied: '${permission}' required`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requirePermission,
  requirePermissionStrict,
  requireRole,
};
