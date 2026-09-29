/**
 * Institute Admin — Budget Management
 *
 * A plan record only — "how much did we allocate to Maintenance for 2026-27" — compared
 * against real Expense rows in the same category/period range to show budget vs. actual.
 * Reuses ExpenseCategory so the two line up directly with no separate mapping.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const CATEGORIES = ['UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'EVENTS', 'MARKETING', 'PROFESSIONAL_FEES', 'SALARY_ADVANCE', 'OTHER'];

const getBudgets = async (req, res, next) => {
  try {
    const { period } = req.query;
    const budgets = await prisma.budget.findMany({
      where: { institutionId: req.institutionId, ...(period && { period }) },
      orderBy: [{ period: 'desc' }, { category: 'asc' }],
    });
    return sendSuccess(res, budgets, 'Budgets retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createOrUpdateBudget = async (req, res, next) => {
  try {
    const { category, period, allocatedAmount, notes } = req.body;
    if (!category || !CATEGORIES.includes(category)) throw new ValidationError(`category must be one of ${CATEGORIES.join(', ')}`);
    if (!period) throw new ValidationError('period is required, e.g. "2026-27"');
    if (allocatedAmount === undefined || allocatedAmount < 0) throw new ValidationError('allocatedAmount must be a non-negative number');

    const budget = await prisma.budget.upsert({
      where: { institutionId_category_period: { institutionId: req.institutionId, category, period } },
      update: { allocatedAmount, notes: notes || null, createdById: req.user.id },
      create: { institutionId: req.institutionId, category, period, allocatedAmount, notes: notes || null, createdById: req.user.id },
    });
    return sendSuccess(res, budget, 'Budget saved successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Budget not found');
    await prisma.budget.delete({ where: { id } });
    return sendSuccess(res, null, 'Budget deleted');
  } catch (err) {
    next(err);
  }
};

/** For a given period, every category's allocated amount next to what's actually been
 * spent (APPROVED + PAID expenses only — a PENDING/REJECTED expense isn't real spend
 * yet) in that same period's date range. Since Budget.period is a free string (an
 * institution might use "2026-27" or "Q1-2026"), the caller supplies the matching
 * from/to date range explicitly rather than this endpoint trying to parse the label. */
const getBudgetVsActual = async (req, res, next) => {
  try {
    const { period, from, to } = req.query;
    if (!period) throw new ValidationError('period is required');
    if (!from || !to) throw new ValidationError('from and to (date range matching this period) are required');

    const [budgets, expenseSums] = await Promise.all([
      prisma.budget.findMany({ where: { institutionId: req.institutionId, period } }),
      prisma.expense.groupBy({
        by: ['category'],
        where: {
          institutionId: req.institutionId,
          status: { in: ['APPROVED', 'PAID'] },
          expenseDate: { gte: new Date(from), lte: new Date(to) },
        },
        _sum: { amount: true },
      }),
    ]);

    const actualByCategory = Object.fromEntries(expenseSums.map((e) => [e.category, e._sum.amount || 0]));
    const allCategories = new Set([...budgets.map((b) => b.category), ...Object.keys(actualByCategory)]);

    const rows = Array.from(allCategories).map((category) => {
      const allocated = budgets.find((b) => b.category === category)?.allocatedAmount || 0;
      const actual = actualByCategory[category] || 0;
      return { category, allocated, actual, remaining: allocated - actual, overBudget: actual > allocated };
    });

    return sendSuccess(res, { period, rows }, 'Budget vs actual retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getBudgets, createOrUpdateBudget, deleteBudget, getBudgetVsActual };
