/**
 * Staff Portal — Expense Logging Controller (Accountant role)
 *
 * Trimmed port of IntituteAdmin_Backend's expenseController — only the surface an
 * Accountant needs (EXPENSES_VIEW, EXPENSES_CREATE). Approving/rejecting/marking-paid
 * (EXPENSES_APPROVE) stays an Institute Admin responsibility and is left out here.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError } = require('../../../shared');

const CATEGORIES = ['UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'EVENTS', 'MARKETING', 'PROFESSIONAL_FEES', 'SALARY_ADVANCE', 'OTHER'];

const getExpenses = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const expenses = await prisma.expense.findMany({
      where: {
        institutionId: req.institutionId,
        ...(status && { status }),
        ...(category && { category }),
      },
      include: { vendor: { select: { name: true } } },
      orderBy: { expenseDate: 'desc' },
    });
    return sendSuccess(res, expenses, 'Expenses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getExpenseSummary = async (req, res, next) => {
  try {
    const [pending, approved, paid, rejected] = await Promise.all([
      prisma.expense.aggregate({ where: { institutionId: req.institutionId, status: 'PENDING' }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { institutionId: req.institutionId, status: 'APPROVED' }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { institutionId: req.institutionId, status: 'PAID' }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { institutionId: req.institutionId, status: 'REJECTED' }, _sum: { amount: true }, _count: true }),
    ]);
    return sendSuccess(res, {
      pending: { count: pending._count, amount: pending._sum.amount || 0 },
      approved: { count: approved._count, amount: approved._sum.amount || 0 },
      paid: { count: paid._count, amount: paid._sum.amount || 0 },
      rejected: { count: rejected._count, amount: rejected._sum.amount || 0 },
    }, 'Expense summary retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { category = 'OTHER', title, description, amount, expenseDate, vendorId } = req.body;
    if (!title || !amount || !expenseDate) throw new ValidationError('title, amount and expenseDate are required');
    if (!CATEGORIES.includes(category)) throw new ValidationError(`category must be one of ${CATEGORIES.join(', ')}`);
    if (amount <= 0) throw new ValidationError('amount must be greater than 0');

    if (vendorId) {
      const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, institutionId: req.institutionId } });
      if (!vendor) throw new NotFoundError('Vendor not found or access denied');
    }

    const expense = await prisma.expense.create({
      data: {
        institutionId: req.institutionId,
        category,
        title,
        description: description || null,
        amount,
        expenseDate: new Date(expenseDate),
        vendorId: vendorId || null,
        requestedById: req.user.id,
      },
    });
    return sendSuccess(res, expense, 'Expense logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Expense not found');
    if (existing.status !== 'PENDING') throw new BusinessRuleError('Only a PENDING expense can be deleted — a decided expense is a financial record, not something to erase');

    await prisma.expense.delete({ where: { id } });
    return sendSuccess(res, null, 'Expense deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getExpenses, getExpenseSummary, createExpense, deleteExpense };
