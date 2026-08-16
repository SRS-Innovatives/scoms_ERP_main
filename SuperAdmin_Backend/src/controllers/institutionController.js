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
      email,
      phone,
      address,
      city,
      state,
      pincode,
      adminEmail,
      adminPassword,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name,
          code,
          type,
          email,
          phone,
          address,
          city,
          state,
          pincode,
        },
      });

      const defaultPassword = adminPassword || 'Admin@123';
      const hashedPassword = await hashPassword(defaultPassword);

      const adminUser = await tx.user.create({
        data: {
          institutionId: institution.id,
          email: adminEmail || `admin@${code.toLowerCase()}.edu.in`,
          password: hashedPassword,
          role: ROLES.INSTITUTE_ADMIN,
          status: 'ACTIVE',
        },
      });

      return { institution, adminUser };
    });

    return sendSuccess(res, result, 'Institution onboarded successfully', 201);
  } catch (err) {
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
  getInstitutionById,
  updateInstitutionStatus,
};
