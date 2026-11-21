/**
 * Late fee — charged automatically, kept separate from the fee itself.
 *
 * Rule (per fee structure, set in the Fee Structure Builder):
 *   lateFeePerDay     ₹ per day
 *   lateFeeGraceDays  days after the due date before it starts
 *   lateFeeMaxAmount  the most it can ever reach for one student's fee (null = no limit)
 *
 * The clock runs from the OLDEST unpaid instalment's due date (or the fee's own due date
 * when it has no instalments). charged = rate × (days late − grace days), capped at the
 * maximum. It only ever grows: paying the fee stops further growth but never cancels a
 * late fee already charged. refreshLateFee is called whenever a fee is viewed and BEFORE
 * any payment is credited, so lateness is always counted up to the payment day.
 *
 * The late fee does not touch the fee's heads, instalments or totals. It has its own
 * charged / waived / paid amounts on StudentFeeAssignment; only the Institute Admin collects
 * or waives it (LateFeeEntry rows, each payment with its own receipt number).
 */
const round2 = (n) => Math.round(n * 100) / 100;
const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** What the late fee should be today (before applying "never decreases"). */
const accruedLateFee = ({ structure, assignment, installments, now = new Date() }) => {
  const rate = Number(structure?.lateFeePerDay) || 0;
  if (rate <= 0) return { amount: 0, daysLate: 0, since: null };
  let since = null;
  if (installments && installments.length) {
    const unpaid = installments.filter((i) => i.status !== 'PAID').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    since = unpaid[0]?.dueDate || null;
  } else if (assignment.dueAmount > 0) {
    since = structure.dueDate;
  }
  if (!since) return { amount: 0, daysLate: 0, since: null };
  const daysLate = Math.floor((startOfDay(now) - startOfDay(since)) / DAY);
  const chargeable = daysLate - (structure.lateFeeGraceDays || 0);
  if (chargeable <= 0) return { amount: 0, daysLate: Math.max(0, daysLate), since };
  let amount = round2(rate * chargeable);
  if (structure.lateFeeMaxAmount !== null && structure.lateFeeMaxAmount !== undefined) amount = Math.min(amount, structure.lateFeeMaxAmount);
  return { amount: round2(amount), daysLate, since };
};

/** What refreshLateFee / refreshLateFees need of an assignment (spread into a Prisma select). */
const LATE_FEE_SELECT = {
  id: true, dueAmount: true, lateFeeCharged: true, lateFeeWaived: true, lateFeePaid: true,
  feeStructure: { select: { dueDate: true, lateFeePerDay: true, lateFeeGraceDays: true, lateFeeMaxAmount: true } },
  installments: { select: { dueDate: true, status: true } },
};

/** The up-to-date late fee of one loaded assignment → { charged, summary } (no database). */
const computeLateFee = (a, now = new Date()) => {
  const { amount, daysLate, since } = accruedLateFee({ structure: a.feeStructure, assignment: a, installments: a.installments, now });
  let charged = Math.max(a.lateFeeCharged, amount);
  const cap = a.feeStructure.lateFeeMaxAmount;
  if (cap !== null && cap !== undefined) charged = Math.min(charged, Math.max(cap, a.lateFeeCharged)); // never below what's already charged
  charged = round2(charged);
  return { charged, summary: lateFeeSummary({ ...a, lateFeeCharged: charged }, { daysLate, since }) };
};

/** Brings one assignment's late fee up to date. Returns the summary. */
const refreshLateFee = async (db, assignmentId, now = new Date()) => {
  const a = await db.studentFeeAssignment.findUnique({ where: { id: assignmentId }, select: LATE_FEE_SELECT });
  if (!a) return null;
  const { charged, summary } = computeLateFee(a, now);
  if (charged !== a.lateFeeCharged) {
    await db.studentFeeAssignment.update({ where: { id: a.id }, data: { lateFeeCharged: charged } });
  }
  return summary;
};

/**
 * The same for many assignments already loaded with LATE_FEE_SELECT — one write per distinct
 * new amount (only for fees whose late fee actually grew), instead of a read + write each.
 * Returns Map(assignmentId → summary).
 */
const refreshLateFees = async (db, rows, now = new Date()) => {
  const out = new Map();
  const changed = new Map(); // new charged amount → ids
  for (const a of rows) {
    const { charged, summary } = computeLateFee(a, now);
    out.set(a.id, summary);
    if (charged !== a.lateFeeCharged) {
      if (!changed.has(charged)) changed.set(charged, []);
      changed.get(charged).push(a.id);
    }
  }
  for (const [charged, ids] of changed) {
    await db.studentFeeAssignment.updateMany({ where: { id: { in: ids } }, data: { lateFeeCharged: charged } });
  }
  return out;
};

const lateFeeSummary = (a, extra = {}) => ({
  charged: round2(a.lateFeeCharged || 0),
  waived: round2(a.lateFeeWaived || 0),
  paid: round2(a.lateFeePaid || 0),
  due: round2(Math.max(0, (a.lateFeeCharged || 0) - (a.lateFeeWaived || 0) - (a.lateFeePaid || 0))),
  ...extra,
});

module.exports = { accruedLateFee, refreshLateFee, refreshLateFees, computeLateFee, lateFeeSummary, LATE_FEE_SELECT };
