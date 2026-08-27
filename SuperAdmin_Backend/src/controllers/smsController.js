/**
 * Super Admin SMS Controller
 */
const { prisma, sendSuccess } = require('../../../shared');

const getSmsStats = async (req, res, next) => {
  try {
    const groups = await prisma.smsLog.groupBy({
      by: ['provider', 'status'],
      _count: { id: true },
    });

    const byProvider = {};
    for (const g of groups) {
      if (!byProvider[g.provider]) {
        byProvider[g.provider] = { provider: g.provider, totalSent: 0, delivered: 0, failed: 0 };
      }
      byProvider[g.provider].totalSent += g._count.id;
      if (g.status === 'SENT' || g.status === 'SIMULATED') {
        byProvider[g.provider].delivered += g._count.id;
      } else if (g.status === 'FAILED') {
        byProvider[g.provider].failed += g._count.id;
      }
    }

    const smsStats = Object.values(byProvider).map((p, idx) => ({
      id: idx + 1,
      ...p,
      status: p.failed === 0 ? 'Active' : 'Degraded',
    }));

    return sendSuccess(res, smsStats, 'SMS stats retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSmsStats,
};
