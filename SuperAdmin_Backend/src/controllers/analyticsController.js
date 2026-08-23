/**
 * Super Admin Analytics Controller
 */
const { prisma, sendSuccess } = require('../../../shared');

const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalInstitutions,
      activeInstitutions,
      totalUsers,
      totalStudents,
      totalStaff
    ] = await Promise.all([
      prisma.institution.count(),
      prisma.institution.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.student.count(),
      prisma.staff.count()
    ]);

    const analytics = {
      totalInstitutions,
      activeInstitutions,
      totalUsers,
      totalStudents,
      totalStaff,
      systemHealth: 99.9,
      storageUsedGB: 124.5
    };

    return sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics
};
