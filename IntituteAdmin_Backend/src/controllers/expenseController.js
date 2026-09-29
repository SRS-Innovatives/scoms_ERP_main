/**
 * Institute Admin — Expense Management
 *
 * Institution operating expenses (utilities, maintenance, supplies, ...) with a
 * lightweight approval workflow: PENDING -> APPROVED|REJECTED -> PAID. Distinct from
 * PurchaseOrder (inventoryController) — an expense doesn't need a physical item behind
 * it, and goes through its own approval rather than a purchase-order lifecycle.
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

const approveExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Expense not found');
    if (existing.status !== 'PENDING') throw new BusinessRuleError('Only a PENDING expense can be approved');

    const expense = await prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: req.user.id, approvedAt: new Date(), rejectionReason: null },
    });
    return sendSuccess(res, expense, 'Expense approved');
  } catch (err) {
    next(err);
  }
};

const rejectExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ValidationError('reason is required to reject an expense');

    const existing = await prisma.expense.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Expense not found');
    if (existing.status !== 'PENDING') throw new BusinessRuleError('Only a PENDING expense can be rejected');

    const expense = await prisma.expense.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: req.user.id, approvedAt: new Date(), rejectionReason: reason },
    });
    return sendSuccess(res, expense, 'Expense rejected');
  } catch (err) {
    next(err);
  }
};

const markExpensePaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Expense not found');
    if (existing.status !== 'APPROVED') throw new BusinessRuleError('Only an APPROVED expense can be marked paid');

    const expense = await prisma.expense.update({ where: { id }, data: { status: 'PAID' } });
    return sendSuccess(res, expense, 'Expense marked as paid');
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

module.exports = { getExpenses, getExpenseSummary, createExpense, approveExpense, rejectExpense, markExpensePaid, deleteExpense };
