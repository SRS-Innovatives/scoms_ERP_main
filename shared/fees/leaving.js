/**
 * Fees when a student leaves (withdrawal / transfer) — the Fee Policy's onLeaving:
 *   KEEP         every due stays (as before)
 *   STOP_FUTURE  instalments not yet due are cancelled; what is already due stays
 *   WRITE_OFF    everything still unpaid (and the late fee) is written off
 * Cancelled / written-off amounts are recorded as a discount on the fee (so heads,
 * instalments and totals stay consistent) and in the audit log. Payments already made
 * are never touched.
 */
const { round2 } = require('./feePolicy');
const { refreshLateFee } = require('./lateFee');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** What settling would do, without changing anything. */
const planLeavingSettlement = async (db, { institutionId, studentId, mode, now = new Date() }) => {
  const today = startOfDay(now);
  const fees = await db.studentFeeAssignment.findMany({
    where: { studentId, feeStructure: { institutionId }, OR: [{ dueAmount: { gt: 0 } }, { lateFeeCharged: { gt: 0 } }] },
    include: { feeStructure: { select: { name: true, dueDate: true } }, installments: { orderBy: { installmentNumber: 'asc' } } },
  });
  const rows = [];
  for (const a of fees) {
    let waive = 0;
    let reason = 'Kept';
    if (mode === 'WRITE_OFF') {
      waive = a.dueAmount;
      reason = 'Written off';
    } else if (mode === 'STOP_FUTURE') {
      if (a.installments.length) {
        waive = a.installments
          .filter((i) => startOfDay(i.dueDate) > today)
          .reduce((s, i) => s + Math.max(0, i.amount - i.paidAmount), 0);
        reason = 'Instalments not yet due cancelled';
      } else if (a.feeStructure.dueDate && startOfDay(a.feeStructure.dueDate) > today) {
        waive = a.dueAmount;
        reason = 'Not yet due — cancelled';
      }
    }
    waive = round2(Math.min(waive, a.dueAmount));
    const lf = mode === 'WRITE_OFF' ? await refreshLateFee(db, a.id) : null;
    rows.push({ assignmentId: a.id, name: a.feeStructure.name, due: a.dueAmount, waive, lateFeeWaive: lf?.due || 0, remaining: round2(a.dueAmount - waive), reason: waive > 0 ? reason : 'Kept' });
  }
  return {
    mode,
    fees: rows,
    totalDue: round2(rows.reduce((s, r) => s + r.due, 0)),
    totalWaive: round2(rows.reduce((s, r) => s + r.waive + r.lateFeeWaive, 0)),
    remaining: round2(rows.reduce((s, r) => s + r.remaining, 0)),
  };
};

/** Applies the plan. Returns it with what was done. */
const applyLeavingSettlement = async (db, { institutionId, studentId, mode, reason, userId }) => {
  const { recomputeItems } = require('./feeItems');
  const plan = await planLeavingSettlement(db, { institutionId, studentId, mode });
  for (const r of plan.fees) {
    if (!(r.waive > 0) && !(r.lateFeeWaive > 0)) continue;
    await db.$transaction(async (tx) => {
      const a = await tx.studentFeeAssignment.findUnique({ where: { id: r.assignmentId } });
      if (r.waive > 0) {
        const discount = round2(a.discountAmount + r.waive);
        const due = round2(Math.max(0, a.totalAmount - discount - a.paidAmount));
        await tx.studentFeeAssignment.update({ where: { id: a.id }, data: { discountAmount: discount, dueAmount: due, status: due <= 0 ? 'PAID' : a.paidAmount > 0 ? 'PARTIAL' : 'PENDING' } });
        await recomputeItems(tx, a.id);
      }
      if (r.lateFeeWaive > 0) {
        await tx.lateFeeEntry.create({ data: { institutionId, studentFeeAssignmentId: a.id, type: 'WAIVER', amount: r.lateFeeWaive, reason: `Student left — ${reason}`.slice(0, 300), createdById: userId } });
        await tx.studentFeeAssignment.update({ where: { id: a.id }, data: { lateFeeWaived: round2(a.lateFeeWaived + r.lateFeeWaive) } });
      }
    });
  }
  await db.auditLog.create({
    data: { institutionId, userId, action: 'FEES_SETTLED_ON_LEAVING', module: 'FEES', entity: 'Student', entityId: studentId, newValues: JSON.stringify({ mode, reason, waived: plan.totalWaive, remaining: plan.remaining }) },
  }).catch(() => {});
  return plan;
};

module.exports = { planLeavingSettlement, applyLeavingSettlement };
