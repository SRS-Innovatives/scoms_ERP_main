/**
 * Institute Admin Settings Controller
 *
 * Audit Logs (read of the AuditLog table other controllers already write to),
 * User Roles / Permission Matrix (read of the real RBAC ROLE_PERMISSIONS map — not a
 * separate hand-maintained copy), Institution Settings (non-secret integration config;
 * SMTP/SMS/payment secrets stay in the server's own .env and are never stored here or
 * echoed back), and a Backup request that logs an auditable request rather than
 * pretending to run an actual pg_dump from a web request.
 */
const {
  prisma,
  sendSuccess,
  ROLES,
  ROLE_PERMISSIONS,
  ValidationError,
} = require('../../../shared');

// ============================================================
// Audit Logs
// ============================================================
const getAuditLogs = async (req, res, next) => {
  try {
    const { module, limit = 100 } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: { institutionId: req.institutionId, ...(module && { module }) },
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    return sendSuccess(res, logs, 'Audit logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// User Roles (RBAC) — real user counts per role, scoped to this institution
// ============================================================
const INSTITUTION_ROLES = [
  ROLES.INSTITUTE_ADMIN, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL, ROLES.HOD,
  ROLES.TEACHER, ROLES.STAFF, ROLES.ACCOUNTANT, ROLES.LIBRARIAN,
  ROLES.TRANSPORT_MANAGER, ROLES.HOSTEL_WARDEN, ROLES.EXAM_ADMIN, ROLES.PLACEMENT_OFFICER,
];

const getUserRoles = async (req, res, next) => {
  try {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      where: { institutionId: req.institutionId, role: { in: INSTITUTION_ROLES } },
      _count: { _all: true },
    });
    const countByRole = Object.fromEntries(counts.map((c) => [c.role, c._count._all]));

    const roles = INSTITUTION_ROLES.map((role) => ({
      role,
      usersCount: countByRole[role] || 0,
      permissionCount: (ROLE_PERMISSIONS[role] || []).length,
    }));

    return sendSuccess(res, roles, 'User roles retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Permission Matrix — the real ROLE_PERMISSIONS map used by requirePermission
// ============================================================
const getPermissionMatrix = async (req, res, next) => {
  try {
    const matrix = INSTITUTION_ROLES.map((role) => ({
      role,
      permissions: ROLE_PERMISSIONS[role] || [],
    }));
    return sendSuccess(res, matrix, 'Permission matrix retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Institution Settings (non-secret integration config)
// ============================================================
const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.institutionSettings.findUnique({ where: { institutionId: req.institutionId } });
    return sendSuccess(res, settings || {}, 'Institution settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const ID_CARD_ORIENTATIONS = ['VERTICAL', 'HORIZONTAL'];
const ID_CARD_TEMPLATES = ['CLASSIC', 'MODERN', 'MINIMAL'];

const updateSettings = async (req, res, next) => {
  try {
    const {
      smtpHost, smtpPort, smtpFromEmail, smsProvider, smsSenderId, smsDltEntityId,
      staffAttendanceSmsEnabled, idCardOrientation, idCardTemplate,
      paymentGatewayProvider, paymentKeyId,
    } = req.body;
    const smsToggle = staffAttendanceSmsEnabled === undefined ? undefined : Boolean(staffAttendanceSmsEnabled);

    if (idCardOrientation !== undefined && !ID_CARD_ORIENTATIONS.includes(idCardOrientation)) {
      throw new ValidationError(`idCardOrientation must be one of: ${ID_CARD_ORIENTATIONS.join(', ')}`);
    }
    if (idCardTemplate !== undefined && !ID_CARD_TEMPLATES.includes(idCardTemplate)) {
      throw new ValidationError(`idCardTemplate must be one of: ${ID_CARD_TEMPLATES.join(', ')}`);
    }

    const settings = await prisma.institutionSettings.upsert({
      where: { institutionId: req.institutionId },
      create: {
        institutionId: req.institutionId, smtpHost, smtpPort, smtpFromEmail, smsProvider, smsSenderId, smsDltEntityId,
        staffAttendanceSmsEnabled: smsToggle ?? true,
        idCardOrientation: idCardOrientation || 'VERTICAL',
        idCardTemplate: idCardTemplate || 'CLASSIC',
        paymentGatewayProvider, paymentKeyId,
      },
      update: {
        smtpHost, smtpPort, smtpFromEmail, smsProvider, smsSenderId, smsDltEntityId,
        ...(smsToggle !== undefined && { staffAttendanceSmsEnabled: smsToggle }),
        ...(idCardOrientation !== undefined && { idCardOrientation }),
        ...(idCardTemplate !== undefined && { idCardTemplate }),
        paymentGatewayProvider, paymentKeyId,
      },
    });
    return sendSuccess(res, settings, 'Settings saved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Backup Request — logs an auditable request; actual execution is an infra-ops task
// ============================================================
const requestBackup = async (req, res, next) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        institutionId: req.institutionId,
        userId: req.user.id,
        action: 'BACKUP_REQUESTED',
        module: 'SETTINGS',
        entity: 'Institution',
        entityId: req.institutionId,
      },
    });
    return sendSuccess(res, log, 'Backup request logged — your platform operations team will process this and notify you when the snapshot is ready.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs,
  getUserRoles,
  getPermissionMatrix,
  getSettings,
  updateSettings,
  requestBackup,
};
