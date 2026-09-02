/**
 * SCOMS Shared Package Root Exports
 */

const { ROLES, PERMISSIONS } = require('./constants/roles');
const STATUSES = require('./constants/statuses');
const { CORE_MODULE_KEYS, MODULE_CATALOG, OPTIONAL_MODULE_KEYS, resolveEnabledModules } = require('./constants/institutionModules');
const errors = require('./errors/customErrors');
const logger = require('./utils/logger');
const responseFormatter = require('./utils/responseFormatter');
const idGenerators = require('./utils/idGenerators');
const prisma = require('./database/client');
const jwt = require('./auth/jwt');
const password = require('./auth/password');
const { ROLE_PERMISSIONS, hasPermission } = require('./permissions/permissionMatrix');
const requireAuth = require('./middleware/requireAuth');
const requireTenant = require('./middleware/requireTenant');
const requireModule = require('./middleware/requireModule');
const { requirePermission, requireRole } = require('./middleware/requirePermission');
const errorHandler = require('./middleware/errorHandler');
const schemas = require('./validation/schemas');

const { handleUnifiedLogin } = require('./auth/unifiedAuth');
const { handleForgotPassword, handleVerifyOtp, handleResetPassword } = require('./auth/passwordReset');
const { sendEmailNotification, sendSMSNotification, sendWhatsAppNotification } = require('./utils/notifications');
const paymentGateway = require('./utils/paymentGateway');
const { formatClassLabel } = require('./utils/classLabel');
const { getHealthPayload } = require('./utils/health');

module.exports = {
  ROLES,
  PERMISSIONS,
  STATUSES,
  CORE_MODULE_KEYS,
  MODULE_CATALOG,
  OPTIONAL_MODULE_KEYS,
  resolveEnabledModules,
  ...errors,
  logger,
  ...responseFormatter,
  ...idGenerators,
  prisma,
  ...jwt,
  ...password,
  handleUnifiedLogin,
  handleForgotPassword,
  handleVerifyOtp,
  handleResetPassword,
  sendEmailNotification,
  sendSMSNotification,
  sendWhatsAppNotification,
  paymentGateway,
  formatClassLabel,
  getHealthPayload,
  ROLE_PERMISSIONS,
  hasPermission,
  requireAuth,
  requireTenant,
  requireModule,
  requirePermission,
  requireRole,
  errorHandler,
  schemas,
};
