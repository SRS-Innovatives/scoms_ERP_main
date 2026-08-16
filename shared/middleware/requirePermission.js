/**
 * Role & Permission Based Access Control (RBAC) Middleware
 */

const { hasPermission } = require('../permissions/permissionMatrix');
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

module.exports = {
  requirePermission,
  requireRole,
};
