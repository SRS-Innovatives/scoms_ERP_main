/**
 * Read-side helper: attach each fee assignment's instalments — amount, paid, status, due
 * date, and which heads each instalment covers — for the student's fee page and the admin's
 * student fee breakdown. Instalments are kept up to date on every payment / discount change
 * (shared/fees/installments.js); this only reads them.
 *
 * Three queries for all the given fees together (their instalments, their heads, and the
 * head order of their structures), however many fees — not up to three per fee.
 */
const { installmentHeads } = require('./installments');

const attachInstallments = async (db, assignments) => {
  if (!assignments.length) return assignments;
  const ids = assignments.map((a) => a.id);
  const allRows = await db.feeInstallment.findMany({
    where: { studentFeeAssignmentId: { in: ids } },
    orderBy: { installmentNumber: 'asc' },
    select: { id: true, studentFeeAssignmentId: true, installmentNumber: true, amount: true, paidAmount: true, status: true, dueDate: true },
  });
  const rowsBy = new Map(ids.map((id) => [id, []]));
  allRows.forEach(({ studentFeeAssignmentId, ...r }) => rowsBy.get(studentFeeAssignmentId).push(r));

  // heads in structure order (same as feeItems.itemsInHeadOrder), only for fees that have instalments
  const withInst = assignments.filter((a) => rowsBy.get(a.id).length);
  const [items, order] = withInst.length ? await Promise.all([
    db.studentFeeItem.findMany({ where: { studentFeeAssignmentId: { in: withInst.map((a) => a.id) } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    db.feeStructureItem.findMany({ where: { feeStructureId: { in: [...new Set(withInst.map((a) => a.feeStructureId))] } }, select: { feeStructureId: true, feeHeadId: true, sortOrder: true } }),
  ]) : [[], []];
  const now = new Date();
  for (const a of assignments) {
    const rows = rowsBy.get(a.id);
    if (rows.length === 0) { a.installments = []; continue; }
    const headOrder = new Map(order.filter((o) => o.feeStructureId === a.feeStructureId).map((o) => [o.feeHeadId, o.sortOrder]));
    const mine = items
      .filter((i) => i.studentFeeAssignmentId === a.id)
      .map((r, idx) => ({ r, idx }))
      .sort((x, y) => (headOrder.get(x.r.feeHeadId) ?? 1e9) - (headOrder.get(y.r.feeHeadId) ?? 1e9) || x.idx - y.idx)
      .map((x) => x.r);
    a.installments = installmentHeads(mine, rows, { plan: a.installmentPlan, base: a.installmentBase })
      .map((i) => ({ ...i, dueAmount: Math.max(0, Math.round((i.amount - i.paidAmount) * 100) / 100), overdue: i.status !== 'PAID' && new Date(i.dueDate) < now }));
  }
  return assignments;
};

module.exports = { attachInstallments };
