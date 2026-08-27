/**
 * Super Admin Institutions Management Controller
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
  NotFoundError,
  ValidationError,
  hashPassword,
  ROLES,
  MODULE_CATALOG,
  OPTIONAL_MODULE_KEYS,
} = require('../../../shared');

const getInstitutions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { students: true }
          }
        }
      }),
      prisma.institution.count({ where }),
    ]);

    return sendPaginated(res, institutions, page, limit, total, 'Institutions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createInstitutionOnboarding = async (req, res, next) => {
  try {
    const {
      name, code, type, registrationNumber, affiliation, email, phone,
      address, city, district, state, pincode, country,
      establishmentYear, adminName, adminEmail, adminPassword, plan, modules, accreditation
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate if code exists
      const existing = await tx.institution.findUnique({ where: { code } });
      if (existing) {
        throw new Error('Institution with this code already exists');
      }

      // 2. Validate email for admin early
      if (adminEmail) {
        const existingUser = await tx.user.findUnique({ where: { email: adminEmail } });
        if (existingUser) {
          throw new Error('User with this admin email already exists');
        }
      }

      // 3. Create institution
      const institution = await tx.institution.create({
        data: {
          name,
          code,
          type: type || 'COLLEGE',
          registrationNumber,
          affiliation: affiliation || accreditation, // store accreditation here if needed, or use separate field
          email,
          phone,
          address,
          city,
          district,
          state,
          pincode,
          country: country || 'India',
          establishedYear: establishmentYear ? parseInt(establishmentYear) : null,
          planName: plan,
          modules: modules ? modules : null,
          principalName: adminName,
        },
      });

      // 4. Create admin user if provided
      if (adminEmail && adminPassword) {
        const hashedPassword = await hashPassword(adminPassword);
        const user = await tx.user.create({
          data: {
            institutionId: institution.id,
            email: adminEmail,
            mobile: phone,
            password: hashedPassword,
            role: ROLES.INSTITUTE_ADMIN,
            status: 'ACTIVE',
          },
        });
        
        await tx.staff.create({
          data: {
            userId: user.id,
            institutionId: institution.id,
            employeeCode: `ADM-${Date.now()}`,
            designation: 'Institute Admin',
          }
        });
      }

      // 5. Create audit log
      await tx.auditLog.create({
        data: {
          institutionId: institution.id,
          userId: req.user.id,
          action: 'CREATE',
          module: 'INSTITUTION',
          entity: 'Institution',
          entityId: institution.id,
          newValues: JSON.stringify(institution),
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || ''
        }
      });

      return institution;
    });

    return sendSuccess(res, result, 'Institution created successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(400).json({ success: false, message: err.message, code: 'DUPLICATE_ENTRY' });
    }
    next(err);
  }
};

const createInstituteAdmin = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    const { firstName, lastName, email, phone, password, designation } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate institution
      const institution = await tx.institution.findUnique({ where: { id: institutionId } });
      if (!institution) throw new NotFoundError('Institution not found');

      // 3. Validate email uniqueness
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) throw new Error('User with this email already exists');

      // 4. Hash password
      const hashedPassword = await hashPassword(password);

      // 5. Create user & 6. Assign role
      const user = await tx.user.create({
        data: {
          institutionId,
          email,
          mobile: phone,
          password: hashedPassword,
          role: ROLES.INSTITUTE_ADMIN,
          status: 'ACTIVE',
        },
      });
      
      // 8. Create staff profile if needed, since name is required for profile
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          institutionId,
          employeeCode: `ADM-${Date.now()}`,
          designation: designation || 'Institute Admin',
        }
      });

      // 9. Create audit log
      await tx.auditLog.create({
        data: {
          institutionId,
          userId: req.user.id,
          action: 'CREATE',
          module: 'USER',
          entity: 'User',
          entityId: user.id,
          newValues: JSON.stringify({ email: user.email, role: user.role }),
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || ''
        }
      });

      const { password: _, ...safeUser } = user;
      return { ...safeUser, profile: staff };
    });

    return sendSuccess(res, result, 'Institute Admin created successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(400).json({ success: false, message: err.message, code: 'DUPLICATE_EMAIL' });
    }
    next(err);
  }
};

const getInstitutionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, email: true, role: true, status: true } },
        _count: { select: { students: true, staff: true } },
      },
    });

    if (!institution) {
      throw new NotFoundError('Institution not found');
    }

    return sendSuccess(res, institution, 'Institution details retrieved');
  } catch (err) {
    next(err);
  }
};

const updateInstitutionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const oldInstitution = await prisma.institution.findUnique({ where: { id } });

    const institution = await prisma.institution.update({
      where: { id },
      data: { status },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        institutionId: id,
        userId: req.user.id,
        action: 'STATUS_CHANGE',
        module: 'INSTITUTION',
        entity: 'Institution',
        entityId: id,
        oldValues: oldInstitution ? JSON.stringify(oldInstitution) : null,
        newValues: JSON.stringify(institution),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      }
    });

    return sendSuccess(res, institution, 'Institution status updated');
  } catch (err) {
    next(err);
  }
};

const updateInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Convert establishedYear to int if present
    if (updateData.establishedYear) {
      updateData.establishedYear = parseInt(updateData.establishedYear);
    }
    
    const oldInstitution = await prisma.institution.findUnique({ where: { id } });

    const institution = await prisma.institution.update({
      where: { id },
      data: updateData,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        institutionId: id,
        userId: req.user.id,
        action: 'UPDATE',
        module: 'INSTITUTION',
        entity: 'Institution',
        entityId: id,
        oldValues: oldInstitution ? JSON.stringify(oldInstitution) : null,
        newValues: JSON.stringify(institution),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      }
    });
    
    return sendSuccess(res, institution, 'Institution updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const institution = await prisma.institution.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'EXPIRED' },
    });
    
    return sendSuccess(res, institution, 'Institution soft-deleted successfully');
  } catch (err) {
    next(err);
  }
};

const getModuleCatalog = async (req, res, next) => {
  try {
    return sendSuccess(res, MODULE_CATALOG, 'Module catalog retrieved');
  } catch (err) {
    next(err);
  }
};

const updateInstitutionModules = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      throw new ValidationError('modules must be an array of module keys');
    }
    const invalid = modules.filter((m) => !OPTIONAL_MODULE_KEYS.includes(m));
    if (invalid.length > 0) {
      throw new ValidationError(`Unknown module key(s): ${invalid.join(', ')}`);
    }

    const oldInstitution = await prisma.institution.findUnique({ where: { id } });
    if (!oldInstitution) throw new NotFoundError('Institution not found');

    const institution = await prisma.institution.update({
      where: { id },
      data: { modules },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: id,
        userId: req.user.id,
        action: 'MODULES_UPDATED',
        module: 'INSTITUTION',
        entity: 'Institution',
        entityId: id,
        oldValues: JSON.stringify({ modules: oldInstitution.modules }),
        newValues: JSON.stringify({ modules }),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      },
    });

    return sendSuccess(res, institution, 'Institution modules updated successfully');
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', institutionId = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          institution: { select: { name: true, code: true } },
          user: { select: { email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendPaginated(res, logs, page, limit, total, 'Audit logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInstitutions,
  createInstitutionOnboarding,
  createInstituteAdmin,
  getInstitutionById,
  updateInstitutionStatus,
  updateInstitution,
  updateInstitutionModules,
  getModuleCatalog,
  deleteInstitution,
  getAuditLogs,
};
