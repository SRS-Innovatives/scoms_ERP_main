/**
 * Super Admin Users Controller
 */
const { prisma, sendSuccess, sendPaginated, ValidationError } = require('../../../shared');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', role = '', group = '', institutionId = '' } = req.query; // Increase default limit to 100 for better view in lists
    const skip = (page - 1) * limit;

    // `group` gives dashboard KPI cards a click-through without the frontend needing to
    // know every individual role enum value. "staff" mirrors what prisma.staff.count()
    // counts on the dashboard — every role with a Staff record — explicitly excluding
    // STUDENT/PARENT (no Staff row) and SUPER_ADMIN/PLATFORM_ADMIN (platform, not tenant staff).
    const STAFF_ROLES = [
      'INSTITUTE_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STAFF',
      'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_MANAGER', 'HOSTEL_WARDEN', 'EXAM_ADMIN', 'PLACEMENT_OFFICER',
    ];
    const GROUP_ROLE_FILTERS = {
      staff: { in: STAFF_ROLES },
      student: 'STUDENT',
    };

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
      ...(group && GROUP_ROLE_FILTERS[group] && { role: GROUP_ROLE_FILTERS[group] }),
      ...(institutionId && { institutionId }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { 
          institution: { select: { name: true, principalName: true } },
          student: { select: { firstName: true, lastName: true } },
          staff: { select: { designation: true } }
        }
      }),
      prisma.user.count({ where }),
    ]);

    const safeUsers = users.map(u => {
      const { password, ...safeUser } = u;
      
      // Determine name dynamically
      let name = 'User';
      if (safeUser.role === 'SUPER_ADMIN') {
        name = 'Super Admin';
      } else if (safeUser.role === 'PLATFORM_ADMIN') {
        name = 'Platform Admin';
      } else if (safeUser.role === 'INSTITUTE_ADMIN') {
        name = safeUser.institution?.principalName || 'Institute Admin';
      } else if (safeUser.student) {
        name = `${safeUser.student.firstName} ${safeUser.student.lastName}`.trim();
      } else if (safeUser.staff) {
        if (safeUser.email) {
          const prefix = safeUser.email.split('@')[0];
          name = prefix.split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        } else {
          name = safeUser.staff.designation || 'Staff Member';
        }
      } else {
        if (safeUser.email) {
          const prefix = safeUser.email.split('@')[0];
          name = prefix.split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }

      // Format role string for display
      const displayRole = String(safeUser.role)
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      return {
        ...safeUser,
        name,
        role: displayRole,
        phone: safeUser.mobile || 'N/A',
        institution: safeUser.institution?.name || 'Platform Master',
        lastLogin: safeUser.lastLoginAt 
          ? new Date(safeUser.lastLoginAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'Never logged in'
      };
    });

    return sendPaginated(res, safeUsers, page, limit, total, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getRoles = async (req, res, next) => {
  try {
    // Count users grouped by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    const countMap = {};
    roleCounts.forEach(item => {
      countMap[item.role] = item._count.id;
    });

    const allRoles = [
      { role: 'SUPER_ADMIN', title: 'Super Admin', desc: 'Unrestricted master control over institutions, billing, security, and platform settings.' },
      { role: 'PLATFORM_ADMIN', title: 'Platform Admin', desc: 'Can manage institutions, onboard tenants, view billing, and manage support tickets.' },
      { role: 'INSTITUTE_ADMIN', title: 'Institute Admin', desc: 'Administrative head of a specific school, college, or university tenant.' },
      { role: 'TEACHER', title: 'Teacher / Faculty', desc: 'Handles classroom teaching, grades entries, timetables, and student attendance.' },
      { role: 'STUDENT', title: 'Student', desc: 'Platform access for viewing classes, study materials, attendance, and online fees payment.' },
      { role: 'PARENT', title: 'Parent', desc: 'Monitors student performance, attendance records, leaves, and fee billing statements.' },
      { role: 'LIBRARIAN', title: 'Librarian', desc: 'Manages cataloging, book issuance, renewals, and library fine billing records.' },
      { role: 'TRANSPORT_MANAGER', title: 'Transport Manager', desc: 'Configures bus routes, manages vehicle fleets, and tracks transport billing.' },
      { role: 'HOSTEL_WARDEN', title: 'Hostel Warden', desc: 'Handles hostel blocks configuration, room allotments, and hostel attendance.' },
      { role: 'ACCOUNTANT', title: 'Accountant', desc: 'Handles institute-level fee setups, collections, receipts, and offline invoicing.' }
    ];

    const data = allRoles.map(r => ({
      ...r,
      usersCount: countMap[r.role] || 0
    }));

    return sendSuccess(res, data, 'Roles and counts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { ROLE_PERMISSIONS } = require('../../../shared');

    // A saved override in the DB takes precedence over the static default matrix
    const override = await prisma.rolePermissionOverride.findUnique({ where: { role } });
    const permissions = override ? override.permissions : (ROLE_PERMISSIONS[role] || []);

    return sendSuccess(res, permissions, `Permissions retrieved for role ${role}`);
  } catch (err) {
    next(err);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      throw new ValidationError('permissions must be an array of permission keys');
    }

    const saved = await prisma.rolePermissionOverride.upsert({
      where: { role },
      create: { role, permissions, updatedBy: req.user?.id || null },
      update: { permissions, updatedBy: req.user?.id || null },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'ROLE_PERMISSIONS_UPDATED',
        module: 'ROLES',
        entity: 'RolePermissionOverride',
        entityId: saved.id,
        newValues: { role, permissions },
      },
    }).catch(() => {});

    return sendSuccess(res, saved.permissions, `Permissions updated successfully for role ${role}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getRoles,
  getRolePermissions,
  updateRolePermissions,
};
