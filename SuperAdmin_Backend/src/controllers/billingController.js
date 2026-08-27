/**
 * Super Admin Billing & GST Controller
 *
 * Generates real, Indian-GST-compliant invoices for institution subscriptions.
 * Tax split (CGST+SGST for intra-state vs IGST for inter-state) is computed by
 * comparing the institution's billing state against the platform's own GST
 * state of registration (PlatformSetting.companyState) — never hardcoded.
 */
const {
  prisma,
  sendSuccess,
  sendPaginated,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

const PLATFORM_SETTINGS_ID = 'global';

const getGstProfile = async () => {
  return prisma.platformSetting.upsert({
    where: { id: PLATFORM_SETTINGS_ID },
    create: { id: PLATFORM_SETTINGS_ID },
    update: {},
  });
};

/**
 * Splits a base amount into CGST+SGST (intra-state) or IGST (inter-state)
 * based on whether the institution's billing state matches the platform's
 * registered GST state.
 */
const computeGstBreakdown = (baseAmount, gstRate, institutionState, companyState) => {
  const taxAmount = Number(((baseAmount * gstRate) / 100).toFixed(2));
  const isIntraState = institutionState && companyState &&
    institutionState.trim().toLowerCase() === companyState.trim().toLowerCase();

  if (isIntraState) {
    const half = Number((taxAmount / 2).toFixed(2));
    return { cgst: half, sgst: taxAmount - half, igst: 0, taxAmount };
  }
  return { cgst: 0, sgst: 0, igst: taxAmount, taxAmount };
};

const generateInvoiceNumber = async () => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // Indian FY starts April
  const fyLabel = `${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`;
  const count = await prisma.invoice.count();
  return `SCOMS/${fyLabel}/${String(count + 1).padStart(4, '0')}`;
};

// ============================================================
// Invoices
// ============================================================

const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '', institutionId = '', search = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(institutionId && { institutionId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { institution: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { institution: { select: { id: true, name: true, code: true, gstin: true, state: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return sendPaginated(res, invoices, page, limit, total, 'Invoices retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [invoice, gstProfile] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: {
          institution: { select: { id: true, name: true, code: true, gstin: true, state: true, address: true, city: true, pincode: true } },
          subscription: { include: { plan: true } },
        },
      }),
      getGstProfile(),
    ]);

    if (!invoice) throw new NotFoundError('Invoice not found');

    return sendSuccess(res, { ...invoice, supplier: gstProfile }, 'Invoice retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const generateInvoice = async (req, res, next) => {
  try {
    const { institutionId, planId, baseAmount: overrideAmount, paymentMode, dueInDays = 15 } = req.body;

    if (!institutionId) throw new ValidationError('institutionId is required');

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundError('Institution not found');

    let plan = null;
    if (planId) {
      plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) throw new NotFoundError('Subscription plan not found');
    }

    const baseAmount = Number(overrideAmount ?? plan?.priceYearly);
    if (!baseAmount || baseAmount <= 0) {
      throw new ValidationError('A valid baseAmount or planId with a priceYearly is required');
    }

    const gstProfile = await getGstProfile();
    const gstRate = 18;
    const { cgst, sgst, igst, taxAmount } = computeGstBreakdown(baseAmount, gstRate, institution.state, gstProfile.companyState);
    const totalAmount = Number((baseAmount + taxAmount).toFixed(2));

    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = new Date(Date.now() + Number(dueInDays) * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        institutionId,
        subscriptionId: req.body.subscriptionId || null,
        planName: plan?.name || req.body.planName || null,
        billingPeriod: req.body.billingPeriod || (plan ? `${plan.name} Subscription (1 Year)` : null),
        baseAmount,
        gstRate,
        sacCode: plan?.sacCode || '998313',
        institutionGstin: institution.gstin || null,
        placeOfSupply: institution.state,
        cgst,
        sgst,
        igst,
        totalAmount,
        paymentMode: paymentMode || null,
        status: 'PENDING',
        dueDate,
      },
      include: { institution: { select: { name: true, code: true } } },
    });

    await prisma.auditLog.create({
      data: {
        institutionId,
        userId: req.user.id,
        action: 'INVOICE_GENERATED',
        module: 'BILLING',
        entity: 'Invoice',
        entityId: invoice.id,
        newValues: JSON.stringify({ invoiceNumber, totalAmount, gstRate }),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      },
    });

    return sendSuccess(res, invoice, 'Invoice generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMode } = req.body;

    const VALID_STATUSES = ['PAID', 'PENDING', 'OVERDUE', 'CANCELLED'];
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Invoice not found');

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(paymentMode !== undefined && { paymentMode }),
        ...(status === 'PAID' && { paidAt: new Date() }),
      },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: existing.institutionId,
        userId: req.user.id,
        action: 'INVOICE_STATUS_UPDATED',
        module: 'BILLING',
        entity: 'Invoice',
        entityId: id,
        oldValues: JSON.stringify({ status: existing.status }),
        newValues: JSON.stringify({ status }),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      },
    });

    return sendSuccess(res, invoice, 'Invoice status updated successfully');
  } catch (err) {
    next(err);
  }
};

const getBillingStats = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany();

    let totalRevenue = 0;
    let pendingRevenue = 0;
    let overdueRevenue = 0;
    let overdueInvoices = 0;
    let totalGstCollected = 0;
    let mrr = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    invoices.forEach((inv) => {
      const invDate = new Date(inv.createdAt);
      if (inv.status === 'PAID') {
        totalRevenue += inv.totalAmount;
        totalGstCollected += (inv.cgst + inv.sgst + inv.igst);
        if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
          mrr += inv.totalAmount;
        }
      } else if (inv.status === 'PENDING') {
        pendingRevenue += inv.totalAmount;
      } else if (inv.status === 'OVERDUE') {
        overdueRevenue += inv.totalAmount;
        overdueInvoices++;
      }
    });

    const stats = {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingRevenue: Number(pendingRevenue.toFixed(2)),
      overdueRevenue: Number(overdueRevenue.toFixed(2)),
      overdueInvoices,
      totalGstCollected: Number(totalGstCollected.toFixed(2)),
      mrr: Number(mrr.toFixed(2)),
      totalInvoices: invoices.length,
    };

    return sendSuccess(res, stats, 'Billing stats retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GST Profile (platform's own "supplier" identity used on every invoice)
// ============================================================

const getGstProfileHandler = async (req, res, next) => {
  try {
    const profile = await getGstProfile();
    return sendSuccess(res, profile, 'GST profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateGstProfile = async (req, res, next) => {
  try {
    const { companyName, companyGstin, companyState, companyAddress } = req.body;

    const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (companyGstin !== undefined && companyGstin && !GSTIN_REGEX.test(companyGstin)) {
      throw new ValidationError('companyGstin is not a valid 15-character GSTIN format');
    }

    const profile = await prisma.platformSetting.upsert({
      where: { id: PLATFORM_SETTINGS_ID },
      create: {
        id: PLATFORM_SETTINGS_ID,
        ...(companyName !== undefined && { companyName }),
        ...(companyGstin !== undefined && { companyGstin }),
        ...(companyState !== undefined && { companyState }),
        ...(companyAddress !== undefined && { companyAddress }),
        updatedBy: req.user?.id || null,
      },
      update: {
        ...(companyName !== undefined && { companyName }),
        ...(companyGstin !== undefined && { companyGstin }),
        ...(companyState !== undefined && { companyState }),
        ...(companyAddress !== undefined && { companyAddress }),
        updatedBy: req.user?.id || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'GST_PROFILE_UPDATED',
        module: 'BILLING',
        entity: 'PlatformSetting',
        entityId: profile.id,
        newValues: JSON.stringify({ companyName, companyGstin, companyState, companyAddress }),
      },
    }).catch(() => {});

    return sendSuccess(res, profile, 'GST profile updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  generateInvoice,
  updateInvoiceStatus,
  getBillingStats,
  getGstProfile: getGstProfileHandler,
  updateGstProfile,
};
