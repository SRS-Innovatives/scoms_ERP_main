/**
 * Super Admin Institutions Management Controller
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
  NotFoundError,
  hashPassword,
  ROLES,
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
      name,
      code,
      type,
      registrationNumber,
      affiliation,
      email,
      phone,
      address,
      city,
      district,
      state,
      pincode,
      country,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate if code exists
      const existing = await tx.institution.findUnique({ where: { code } });
      if (existing) {
        throw new Error('Institution with this code already exists');
      }

      // 2. Create institution
      const institution = await tx.institution.create({
        data: {
          name,
          code,
          type: type || 'COLLEGE',
          registrationNumber,
          affiliation,
          email,
          phone,
          address,
          city,
          district,
          state,
          pincode,
          country: country || 'India',
        },
      });

      // 8. Create audit log
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
      return res.status(400).json({ success: false, message: err.message, code: 'DUPLICATE_CODE' });
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

    const institution = await prisma.institution.update({
      where: { id },
      data: { status },
    });

    return sendSuccess(res, institution, 'Institution status updated');
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
};
