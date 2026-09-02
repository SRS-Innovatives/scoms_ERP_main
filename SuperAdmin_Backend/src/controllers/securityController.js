/**
 * Super Admin Security Center Controller
 *
 * Real signal only — no fabricated firewall/threat/SSL data (no such infrastructure
 * exists). Built entirely from AuditLog rows written by the shared login handler.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getSecurityOverview = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [successToday, failedToday, recentLogins] = await Promise.all([
      prisma.auditLog.count({ where: { action: 'LOGIN_SUCCESS', createdAt: { gte: startOfDay } } }),
      prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: startOfDay } } }),
      prisma.auditLog.findMany({
        where: { action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] } },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          institution: { select: { name: true } },
          user: { select: { email: true, role: true } },
        },
      }),
    ]);

    const totalAttemptsToday = successToday + failedToday;
    const failureRate = totalAttemptsToday > 0 ? Number(((failedToday / totalAttemptsToday) * 100).toFixed(1)) : 0;

    return sendSuccess(res, {
      successToday,
      failedToday,
      totalAttemptsToday,
      failureRate,
      recentLogins,
    }, 'Security overview retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSecurityOverview };
