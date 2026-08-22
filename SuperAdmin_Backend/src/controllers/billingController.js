/**
 * Super Admin Billing Controller
 */
const { prisma, sendSuccess, sendPaginated } = require('../../../shared');

const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { institution: { select: { name: true } } }
      }),
      prisma.invoice.count(),
    ]);

    return sendPaginated(res, invoices, page, limit, total, 'Invoices retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getBillingStats = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany();
    
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let overdueInvoices = 0;

    invoices.forEach(inv => {
      if (inv.status === 'PAID') {
        totalRevenue += inv.amount;
      } else if (inv.status === 'PENDING') {
        pendingRevenue += inv.amount;
      } else if (inv.status === 'OVERDUE') {
        overdueInvoices++;
      }
    });

    const stats = {
      totalRevenue,
      pendingRevenue,
      overdueInvoices,
      totalInvoices: invoices.length
    };

    return sendSuccess(res, stats, 'Billing stats retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices,
  getBillingStats
};
