/**
 * SCOMS Shared Package Root Exports
 */

const { ROLES, PERMISSIONS } = require('./constants/roles');
const STATUSES = require('./constants/statuses');
const { CORE_MODULE_KEYS, MODULE_CATALOG, OPTIONAL_MODULE_KEYS, resolveEnabledModules, resolveStructureType, getRecommendedModules } = require('./constants/institutionModules');
const errors = require('./errors/customErrors');
const logger = require('./utils/logger');
const responseFormatter = require('./utils/responseFormatter');
const idGenerators = require('./utils/idGenerators');
const { generateApiKey } = require('./utils/apiKeys');
const { DEFAULT_GRADE_CURVE, getGradeScale, resolveGrade, gradePointFor, computeGrade } = require('./utils/grading');
const { DEFAULT_LISTS, LIST_TYPES, getActiveList } = require('./utils/customLists');
const prisma = require('./database/client');
const jwt = require('./auth/jwt');
const password = require('./auth/password');
const { ROLE_PERMISSIONS, hasPermission } = require('./permissions/permissionMatrix');
const requireAuth = require('./middleware/requireAuth');
const requireTenant = require('./middleware/requireTenant');
const requireModule = require('./middleware/requireModule');
const resolveActiveChild = require('./middleware/resolveActiveChild');
const blockParentWrite = require('./middleware/blockParentWrite');
const { loginLimiter, otpLimiter, publicSubmissionLimiter } = require('./middleware/rateLimiter');
const { requirePermission, requirePermissionStrict, requireRole } = require('./middleware/requirePermission');
const shadowPermission = require('./middleware/shadowPermission');
const errorHandler = require('./middleware/errorHandler');
const schemas = require('./validation/schemas');

const { handleUnifiedLogin } = require('./auth/unifiedAuth');
const { handleForgotPassword, handleVerifyOtp, handleResetPassword } = require('./auth/passwordReset');
const { sendEmailNotification, sendSMSNotification, sendWhatsAppNotification } = require('./utils/notifications');
const paymentGateway = require('./utils/paymentGateway');
const { formatClassLabel } = require('./utils/classLabel');
const { getHealthPayload } = require('./utils/health');
const reportEngine = require('./reportEngine');
const moduleRegistry = require('./moduleRegistry');
const certificateEngine = require('./certificateEngine');
const { pushNotification, pushNotificationToMany } = require('./utils/notificationCenter');
const { askAi, getAiSettings } = require('./utils/aiProvider');
const { emitEvent } = require('./events/dispatcher');
const { EVENT_TYPES } = require('./events/eventTypes');
const { seedIntegrationProviders } = require('./integrations/seedIntegrationProviders');
const { resolveRoom, resolveRoomsById } = require('./utils/rooms');
const resultLifecycle = require('./exams/resultLifecycle');
const {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
} = require('./notifications/notificationControllerBase');

module.exports = {
  ROLES,
  PERMISSIONS,
  STATUSES,
  CORE_MODULE_KEYS,
  MODULE_CATALOG,
  OPTIONAL_MODULE_KEYS,
  resolveEnabledModules,
  resolveStructureType,
  getRecommendedModules,
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
  reportEngine,
  moduleRegistry,
  certificateEngine,
  ROLE_PERMISSIONS,
  hasPermission,
  requireAuth,
  requireTenant,
  requireModule,
  resolveActiveChild,
  blockParentWrite,
  loginLimiter,
  otpLimiter,
  publicSubmissionLimiter,
  generateApiKey,
  DEFAULT_GRADE_CURVE,
  getGradeScale,
  resolveGrade,
  gradePointFor,
  computeGrade,
  DEFAULT_LISTS,
  LIST_TYPES,
  getActiveList,
  requirePermission,
  requirePermissionStrict,
  requireRole,
  shadowPermission,
  errorHandler,
  schemas,
  pushNotification,
  pushNotificationToMany,
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
  askAi,
  getAiSettings,
  emitEvent,
  EVENT_TYPES,
  seedIntegrationProviders,
  resolveRoom,
  resolveRoomsById,
  resultLifecycle,
};
