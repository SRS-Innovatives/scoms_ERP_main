/**
 * Super Admin AI Usage Controller
 */
const { prisma, sendSuccess } = require('../../../shared');

const getAiUsage = async (req, res, next) => {
  try {
    const [aggregate, moduleGroups, providerGroup] = await Promise.all([
      prisma.aiUsageLog.aggregate({
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true, costUSD: true },
        _count: { id: true },
      }),
      prisma.aiUsageLog.groupBy({ by: ['module'], _count: { id: true } }),
      prisma.aiUsageLog.groupBy({ by: ['provider'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 1 }),
    ]);

    const aiStats = {
      totalTokens: aggregate._sum.totalTokens || 0,
      totalCostUSD: Number((aggregate._sum.costUSD || 0).toFixed(4)),
      totalRequests: aggregate._count.id || 0,
      provider: providerGroup[0]?.provider || 'No usage recorded yet',
      activeModules: moduleGroups.map((g) => g.module),
    };

    return sendSuccess(res, aiStats, 'AI usage retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAiUsage,
};
