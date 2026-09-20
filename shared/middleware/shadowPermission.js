/**
 * RBAC Shadow Mode → Enforcement (Phase 3, step 1 + 2)
 *
 * Wires the existing, previously-dead ROLE_PERMISSIONS matrix (shared/permissions/
 * permissionMatrix.js) into every route. Behavior is controlled by RBAC_ENFORCEMENT_ENABLED
 * (env, default unset/false — mirrors the MODULE_REGISTRY_ENABLED flag pattern):
 *
 *   - OFF (default): shadow mode. Computes what hasPermissionAsync() would decide and,
 *     only on a would-be DENY, writes an AuditLog row (module: 'RBAC_SHADOW') — never
 *     blocks the request. Lets real traffic surface every role/route combination that
 *     currently works but the matrix would reject, so gaps can be fixed before
 *     enforcement is live.
 *   - ON: enforcement mode. A DENY throws AuthorizationError (403) instead of logging.
 *
 * hasPermissionAsync() checks a saved RolePermissionOverride row before falling back to
 * the static matrix — SuperAdmin's Permission Matrix page writes there. Without this,
 * an edit made in that page persists and redisplays correctly but changes nothing about
 * real authorization, since this was the only place that ever consulted it.
 *
 * Only TEACHER and INSTITUTE_ADMIN have been exercised against this matrix with real
 * live traffic as of this writing — the other 9 roles are matrix-only, never enforced.
 * Do not flip this on globally without shadow-log review across all roles first; per-role
 * or per-backend rollout can be layered on top of this same check later if needed.
 *
 * Logging is deliberately fire-and-forget: a logging failure must never affect the
 * request. Enforcement, once on, is NOT fire-and-forget — a deny must actually block.
 */
const { hasPermissionAsync } = require('../permissions/permissionMatrix');
const prisma = require('../database/client');
const logger = require('../utils/logger');
const { AuthorizationError } = require('../errors/customErrors');

const isEnforcementEnabled = () => process.env.RBAC_ENFORCEMENT_ENABLED === 'true';

const shadowPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;
      const allowed = role ? await hasPermissionAsync(prisma, role, permission) : false;
      const denied = role && !allowed;

      if (!denied) return next();

      if (isEnforcementEnabled()) {
        return next(new AuthorizationError(`Permission denied: '${permission}' required`));
      }

      prisma.auditLog.create({
        data: {
          institutionId: req.institutionId || req.user?.institutionId || null,
          userId: req.user?.id || null,
          action: 'SHADOW_DENY',
          module: 'RBAC_SHADOW',
          entity: 'PermissionCheck',
          entityId: null,
          newValues: JSON.stringify({
            role,
            permission,
            method: req.method,
            path: req.originalUrl,
          }),
        },
      }).catch((err) => logger.warn('[RBAC Shadow] audit log write failed', { error: err.message }));
      next();
    } catch (err) {
      // A failed permission lookup must never silently grant access — but it also must
      // never crash the request in shadow mode, matching the old fire-and-forget
      // logging contract. In enforcement mode, fail closed.
      logger.warn('[RBAC Shadow] check failed', { error: err.message });
      if (isEnforcementEnabled()) {
        return next(new AuthorizationError(`Permission check failed for '${permission}'`));
      }
      next();
    }
  };
};

module.exports = shadowPermission;
module.exports.isEnforcementEnabled = isEnforcementEnabled;
