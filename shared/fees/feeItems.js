/**
 * Fee Engine consistency helpers.
 *
 * 1. allocatePaymentToItems — a payment recorded against a student's fee assignment as a
 *    lump sum (online/Razorpay, the Staff fee desk, the admin's legacy collect) is also
 *    spread across that assignment's per-head StudentFeeItems, in the structure's head order, with a
 *    PaymentAllocation row per head — exactly what "Collect Fee (POS/UPI)" records when
 *    the cashier picks the heads. Without this the head-wise breakdown kept showing heads
 *    as unpaid after the student had paid. Legacy assignments without items are untouched.
 *
 * 2. versionChainIds / latestVersions — every version of a fee structure (v1, v2, ...
 *    made with "duplicate as new version") points its parentStructureId at the ORIGINAL
 *    structure. A student must only ever hold ONE version of a fee: assigning v2 to a
 *    class whose students already had v1 used to give them both (double charge).
 */
const { recomputeInstallments } = require('./installments');

const round2 = (n) => Math.round(n * 100) / 100;

/** Spread `amount` over the assignment's unpaid items, in the order the heads are arranged
 * in the fee structure (the builder's order). Returns what was allocated. */
const allocatePaymentToItems = async (tx, { assignmentId, paymentId, amount }) => {
  let remaining = round2(Number(amount));
  if (!(remaining > 0)) return 0;
  const [rows, assignment] = await Promise.all([
    tx.studentFeeItem.findMany({
      where: { studentFeeAssignmentId: assignmentId, dueAmount: { gt: 0 } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    tx.studentFeeAssignment.findUnique({ where: { id: assignmentId }, select: { feeStructureId: true } }),
  ]);
  if (rows.length === 0) {
    // legacy assignment without per-head items — still keep its instalments in step
    await recomputeInstallments(tx, assignmentId);
    return 0;
  }
  const headOrder = new Map((await tx.feeStructureItem.findMany({
    where: { feeStructureId: assignment.feeStructureId },
    select: { feeHeadId: true, sortOrder: true },
  })).map((i) => [i.feeHeadId, i.sortOrder]));
  const items = rows
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => (headOrder.get(a.r.feeHeadId) ?? 1e9) - (headOrder.get(b.r.feeHeadId) ?? 1e9) || a.idx - b.idx)
    .map((x) => x.r);
  const allocations = [];
  for (const item of items) {
    if (remaining <= 0) break;
    const share = round2(Math.min(remaining, item.dueAmount));
    if (share <= 0) continue;
    const paid = round2(item.paidAmount + share);
    const due = round2(Math.max(0, item.dueAmount - share));
    await tx.studentFeeItem.update({
      where: { id: item.id },
      data: { paidAmount: paid, dueAmount: due, status: due <= 0 ? 'PAID' : 'PARTIAL' },
    });
    allocations.push({ feePaymentId: paymentId, studentFeeItemId: item.id, amount: share });
    remaining = round2(remaining - share);
  }
  if (allocations.length) await tx.paymentAllocation.createMany({ data: allocations });
  // instalments follow the same head order — refresh what's paid on each (callers have
  // already updated the assignment's paidAmount in this transaction)
  await recomputeInstallments(tx, assignmentId);
  return round2(Number(amount) - remaining);
};

/** All items of an assignment, in the fee structure's head order. */
const itemsInHeadOrder = async (db, assignmentId, feeStructureId) => {
  const [rows, order] = await Promise.all([
    db.studentFeeItem.findMany({ where: { studentFeeAssignmentId: assignmentId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    db.feeStructureItem.findMany({ where: { feeStructureId }, select: { feeHeadId: true, sortOrder: true } }),
  ]);
  const headOrder = new Map(order.map((i) => [i.feeHeadId, i.sortOrder]));
  return rows
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => (headOrder.get(a.r.feeHeadId) ?? 1e9) - (headOrder.get(b.r.feeHeadId) ?? 1e9) || a.idx - b.idx)
    .map((x) => x.r);
};

/**
 * Rebuilds one assignment's per-head figures from the facts, so the head-wise breakdown
 * always adds up to the assignment's totals:
 *   paid     = the PaymentAllocation rows recorded against that head
 *   discount = the assignment's discountAmount spread over heads in structure order
 *              (each head at most what it still owes after its payments)
 *   due      = amount − discount − paid
 * Idempotent — safe to call after any concession approve/revoke or scholarship change.
 *
 * allocateMissing (backfill): first record allocations for any part of the assignment's
 * successful payments that was never split per head (payments taken before per-head
 * allocation existed on that path), in payment-date order. Returns a summary.
 */
const recomputeItems = async (tx, assignmentId, { allocateMissing = false } = {}) => {
  const assignment = await tx.studentFeeAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, feeStructureId: true, discountAmount: true, dueAmount: true },
  });
  if (!assignment) return null;
  const items = await itemsInHeadOrder(tx, assignmentId, assignment.feeStructureId);
  if (items.length === 0) {
    await recomputeInstallments(tx, assignmentId);
    return { assignmentId, items: 0, allocated: 0, itemDue: null, assignmentDue: assignment.dueAmount };
  }

  const itemIds = items.map((i) => i.id);
  const existing = await tx.paymentAllocation.groupBy({ by: ['studentFeeItemId'], where: { studentFeeItemId: { in: itemIds } }, _sum: { amount: true } });
  const paid = new Map(items.map((i) => [i.id, 0]));
  existing.forEach((e) => paid.set(e.studentFeeItemId, round2(e._sum.amount || 0)));

  // 1. discount, spread in head order (never more than a head still owes after its payments)
  let discountLeft = round2(assignment.discountAmount || 0);
  const discount = new Map();
  for (const i of items) {
    const give = round2(Math.max(0, Math.min(discountLeft, i.amount - paid.get(i.id))));
    discount.set(i.id, give);
    discountLeft = round2(discountLeft - give);
  }

  // 2. (backfill only) allocate payments that were never split per head
  let allocated = 0;
  if (allocateMissing) {
    const payments = await tx.feePayment.findMany({
      where: { studentFeeAssignmentId: assignmentId, paymentStatus: 'SUCCESS' },
      select: { id: true, amountPaid: true, creditAmount: true, allocations: { select: { amount: true } } },
      orderBy: [{ paidAt: 'asc' }, { id: 'asc' }],
    });
    const rows = [];
    for (const p of payments) {
      // the part kept as fee credit (an overpayment) never belongs to this fee's heads
      let left = round2(p.amountPaid - (p.creditAmount || 0) - p.allocations.reduce((s, a) => s + a.amount, 0));
      for (const i of items) {
        if (left <= 0) break;
        const room = round2(i.amount - discount.get(i.id) - paid.get(i.id));
        const share = round2(Math.min(left, room));
        if (share <= 0) continue;
        rows.push({ feePaymentId: p.id, studentFeeItemId: i.id, amount: share });
        paid.set(i.id, round2(paid.get(i.id) + share));
        left = round2(left - share);
        allocated = round2(allocated + share);
      }
    }
    if (rows.length) await tx.paymentAllocation.createMany({ data: rows });
  }

  // 3. write paid / discount / due / status per head
  let itemDue = 0;
  for (const i of items) {
    const p = paid.get(i.id);
    const d = discount.get(i.id);
    const due = round2(Math.max(0, i.amount - d - p));
    itemDue = round2(itemDue + due);
    const status = due <= 0 ? 'PAID' : p > 0 ? 'PARTIAL' : 'PENDING';
    if (i.paidAmount !== p || i.discountAmount !== d || i.dueAmount !== due || i.status !== status) {
      await tx.studentFeeItem.update({ where: { id: i.id }, data: { paidAmount: p, discountAmount: d, dueAmount: due, status } });
    }
  }
  // instalments follow the discount and payments too
  await recomputeInstallments(tx, assignmentId);
  return { assignmentId, items: items.length, allocated, itemDue, assignmentDue: assignment.dueAmount };
};

/** Root id of a structure's version chain. */
const chainRootId = (structure) => structure.parentStructureId || structure.id;

/** Ids of every version (any status) of the same fee as `structure`. */
const versionChainIds = async (db, structure) => {
  const root = chainRootId(structure);
  const rows = await db.feeStructure.findMany({
    where: { institutionId: structure.institutionId, OR: [{ id: root }, { parentStructureId: root }] },
    select: { id: true },
  });
  return rows.map((r) => r.id);
};

/** From a list of structures, keep only the highest version of each fee. */
const latestVersions = (structures) => {
  const best = new Map();
  for (const s of structures) {
    const root = chainRootId(s);
    const current = best.get(root);
    if (!current || s.version > current.version) best.set(root, s);
  }
  return [...best.values()];
};

module.exports = { allocatePaymentToItems, recomputeItems, itemsInHeadOrder, versionChainIds, latestVersions, chainRootId };
