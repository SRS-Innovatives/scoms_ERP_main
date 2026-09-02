/**
 * Super Admin Email Controller
 *
 * Same real workflow as the SMS wallet: purchase email-sending credits from a
 * transactional email provider (SendGrid/Mailgun/SES/etc.), allocate them to a specific
 * institution, and every email that institution sends (see shared/utils/notifications.js)
 * draws down its wallet balance — blocked once exhausted, not faked.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} = require('../../../shared');

const PLATFORM_WALLET_ID = 'global';

const getPlatformWallet = () =>
  prisma.platformEmailWallet.upsert({
    where: { id: PLATFORM_WALLET_ID },
    create: { id: PLATFORM_WALLET_ID },
    update: {},
  });

// ============================================================
// Usage stats (real, aggregated from EmailLog)
// ============================================================
const getEmailStats = async (req, res, next) => {
  try {
    const groups = await prisma.emailLog.groupBy({
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

    const emailStats = Object.values(byProvider).map((p, idx) => ({
      id: idx + 1,
      ...p,
      status: p.failed === 0 ? 'Active' : 'Degraded',
    }));

    return sendSuccess(res, emailStats, 'Email stats retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getRecentEmailLogs = async (req, res, next) => {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { institution: { select: { name: true } } },
    });
    return sendSuccess(res, logs, 'Recent email logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Wallet overview (platform balance + every institution's balance)
// ============================================================
const getWalletOverview = async (req, res, next) => {
  try {
    const [platformWallet, institutions, wallets, recentPurchases, recentAllocations] = await Promise.all([
      getPlatformWallet(),
      prisma.institution.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      prisma.institutionEmailWallet.findMany(),
      prisma.emailPurchase.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.emailAllocation.findMany({
        include: { institution: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const walletByInstitution = Object.fromEntries(wallets.map((w) => [w.institutionId, w]));
    const institutionWallets = institutions.map((inst) => {
      const w = walletByInstitution[inst.id];
      return {
        institutionId: inst.id,
        institution: inst,
        balance: w?.balance ?? 0,
        totalAllocated: w?.totalAllocated ?? 0,
        totalUsed: w?.totalUsed ?? 0,
        updatedAt: w?.updatedAt ?? null,
      };
    });

    return sendSuccess(res, {
      platformWallet,
      institutionWallets,
      recentPurchases,
      recentAllocations,
    }, 'Email wallet overview retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Purchase credits from a third-party email provider (tops up platform wallet)
// ============================================================
const purchaseEmailCredits = async (req, res, next) => {
  try {
    const { provider, credits, amountINR, reference } = req.body;

    if (!provider) throw new ValidationError('provider is required');
    const creditsNum = Number(credits);
    const amountNum = Number(amountINR);
    if (!creditsNum || creditsNum <= 0) throw new ValidationError('credits must be a positive number');
    if (!amountNum || amountNum <= 0) throw new ValidationError('amountINR must be a positive number');

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.emailPurchase.create({
        data: {
          provider,
          credits: creditsNum,
          amountINR: amountNum,
          reference: reference || null,
          purchasedBy: req.user.id,
        },
      });

      const wallet = await tx.platformEmailWallet.upsert({
        where: { id: PLATFORM_WALLET_ID },
        create: { id: PLATFORM_WALLET_ID, balance: creditsNum, totalPurchased: creditsNum },
        update: { balance: { increment: creditsNum }, totalPurchased: { increment: creditsNum } },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EMAIL_CREDITS_PURCHASED',
          module: 'EMAIL',
          entity: 'EmailPurchase',
          entityId: purchase.id,
          newValues: JSON.stringify({ provider, credits: creditsNum, amountINR: amountNum }),
        },
      });

      return { purchase, wallet };
    });

    return sendSuccess(res, result, `${creditsNum.toLocaleString()} email credits purchased successfully`, 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Allocate credits from the platform wallet to a specific institution
// ============================================================
const allocateEmailCredits = async (req, res, next) => {
  try {
    const { institutionId, credits, note } = req.body;

    if (!institutionId) throw new ValidationError('institutionId is required');
    const creditsNum = Number(credits);
    if (!creditsNum || creditsNum <= 0) throw new ValidationError('credits must be a positive number');

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundError('Institution not found');

    const result = await prisma.$transaction(async (tx) => {
      const platformWallet = await tx.platformEmailWallet.upsert({
        where: { id: PLATFORM_WALLET_ID },
        create: { id: PLATFORM_WALLET_ID },
        update: {},
      });

      if (platformWallet.balance < creditsNum) {
        throw new BusinessRuleError(
          `Insufficient platform email balance: ${platformWallet.balance.toLocaleString()} available, ${creditsNum.toLocaleString()} requested. Purchase more credits first.`
        );
      }

      const allocation = await tx.emailAllocation.create({
        data: { institutionId, credits: creditsNum, note: note || null, allocatedBy: req.user.id },
      });

      await tx.platformEmailWallet.update({
        where: { id: PLATFORM_WALLET_ID },
        data: { balance: { decrement: creditsNum }, totalAllocated: { increment: creditsNum } },
      });

      const institutionWallet = await tx.institutionEmailWallet.upsert({
        where: { institutionId },
        create: { institutionId, balance: creditsNum, totalAllocated: creditsNum },
        update: { balance: { increment: creditsNum }, totalAllocated: { increment: creditsNum } },
      });

      await tx.auditLog.create({
        data: {
          institutionId,
          userId: req.user.id,
          action: 'EMAIL_CREDITS_ALLOCATED',
          module: 'EMAIL',
          entity: 'EmailAllocation',
          entityId: allocation.id,
          newValues: JSON.stringify({ credits: creditsNum, note }),
        },
      });

      return { allocation, institutionWallet };
    });

    return sendSuccess(res, result, `${creditsNum.toLocaleString()} email credits allocated to ${institution.name}`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmailStats,
  getRecentEmailLogs,
  getWalletOverview,
  purchaseEmailCredits,
  allocateEmailCredits,
};
