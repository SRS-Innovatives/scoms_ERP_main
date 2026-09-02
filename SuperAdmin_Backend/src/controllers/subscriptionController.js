/**
 * Super Admin Subscription Controller
 */
const { prisma, sendSuccess, sendPaginated, NotFoundError, ValidationError, sendEmailNotification } = require('../../../shared');

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

const createPlan = async (req, res, next) => {
  try {
    const { name, priceMonthly, priceYearly, maxStudents, maxStaff, features } = req.body;
    if (!name || priceMonthly === undefined || priceYearly === undefined) {
      throw new ValidationError('name, priceMonthly and priceYearly are required');
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        maxStudents: maxStudents ? Number(maxStudents) : undefined,
        maxStaff: maxStaff ? Number(maxStaff) : undefined,
        features: Array.isArray(features) ? features : undefined,
      },
    });

    return sendSuccess(res, plan, 'Subscription plan created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, priceMonthly, priceYearly, maxStudents, maxStaff, features } = req.body;

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Plan not found');

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(priceMonthly !== undefined && { priceMonthly: Number(priceMonthly) }),
        ...(priceYearly !== undefined && { priceYearly: Number(priceYearly) }),
        ...(maxStudents !== undefined && { maxStudents: Number(maxStudents) }),
        ...(maxStaff !== undefined && { maxStaff: Number(maxStaff) }),
        ...(features !== undefined && { features }),
      },
    });

    return sendSuccess(res, plan, 'Subscription plan updated successfully');
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

/** Every subscription with real days-remaining-to-expiry, for the renewals dashboard. */
const getRenewals = async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { endDate: 'asc' },
      include: {
        institution: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
      },
    });

    const now = new Date();
    const withStatus = subscriptions.map((sub) => {
      const daysLeft = Math.ceil((new Date(sub.endDate) - now) / 86400000);
      let renewalStatus;
      if (daysLeft <= 0) renewalStatus = 'Expired';
      else if (daysLeft <= 30) renewalStatus = 'Expiring Soon';
      else renewalStatus = 'Active';
      return { ...sub, daysLeft: Math.max(daysLeft, 0), renewalStatus };
    });

    const kpis = {
      totalSubscribers: subscriptions.length,
      expiringSoon: withStatus.filter((s) => s.renewalStatus === 'Expiring Soon').length,
      expired: withStatus.filter((s) => s.renewalStatus === 'Expired').length,
      active: withStatus.filter((s) => s.renewalStatus === 'Active').length,
    };

    return sendSuccess(res, { subscriptions: withStatus, kpis }, 'Renewals retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Sends a real renewal reminder email to the institution's registered contact address. */
const sendRenewalReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { institution: { select: { name: true, email: true } }, plan: { select: { name: true } } },
    });
    if (!subscription) throw new NotFoundError('Subscription not found');

    const daysLeft = Math.ceil((new Date(subscription.endDate) - new Date()) / 86400000);
    const sent = await sendEmailNotification({
      to: subscription.institution.email,
      subject: `SCOMS Subscription Renewal — ${subscription.plan.name}`,
      text: `Dear ${subscription.institution.name} Administrator,\n\nYour SCOMS "${subscription.plan.name}" subscription ${daysLeft <= 0 ? 'has expired' : `expires in ${daysLeft} day(s)`} on ${new Date(subscription.endDate).toLocaleDateString()}. Please renew to avoid service interruption.\n\n— SCOMS Platform Team`,
      purpose: 'SUBSCRIPTION_RENEWAL',
    });

    return sendSuccess(res, { sent }, sent ? 'Renewal reminder sent' : 'Reminder could not be sent (email delivery blocked)');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  getSubscriptions,
  getRenewals,
  sendRenewalReminder,
};
