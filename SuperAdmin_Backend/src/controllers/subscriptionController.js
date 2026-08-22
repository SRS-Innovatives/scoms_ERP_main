/**
 * Super Admin Subscription Controller
 */
const { prisma, sendSuccess, sendPaginated } = require('../../../shared');

const getPlans = async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' }
    });
    return sendSuccess(res, plans, 'Plans retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { 
          institution: { select: { name: true, code: true } },
          plan: { select: { name: true, priceMonthly: true } }
        }
      }),
      prisma.subscription.count(),
    ]);

    return sendPaginated(res, subscriptions, page, limit, total, 'Subscriptions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlans,
  getSubscriptions
};
