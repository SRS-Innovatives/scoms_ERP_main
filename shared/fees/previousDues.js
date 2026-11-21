/**
 * Previous academic year's unpaid fees — Fee Policy → "Previous year dues".
 *
 * "Previous dues" of a fee = the same student's other unpaid fees whose academic year started
 * before this fee's academic year (several old years count together). What happens when a
 * student pays a later year's fee while some are unpaid (FeePolicy.previousYearDues):
 *   ALLOW        nothing special (as before)
 *   BLOCK        the payment is refused until the previous dues are cleared. The fee office may
 *                bypass it for one payment with a reason when previousYearOverride is on (audited);
 *                a student paying online never can.
 *   AUTO_ADJUST  the payment clears the previous dues first, oldest year first (each fee gets
 *                its own payment + receipt); only what is left goes to the chosen fee.
 *                The head-wise counter (pick heads of one fee) can't spread — there it blocks.
 * Previous dues below previousYearMinDue are ignored. A student with an active
 * FeeDuesException (management approval, until a date) is never blocked or auto-adjusted.
 */
const { BusinessRuleError } = require('../errors/customErrors');

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const inr = (n) => `₹${round2(n).toLocaleString('en-IN')}`;

/** The academic year of one fee: { id, yearName, startDate } (null if unknown). */
const yearOf = async (db, assignmentId) => {
  const a = await db.studentFeeAssignment.findUnique({
    where: { id: assignmentId },
    select: { studentId: true, feeStructure: { select: { academicYear: { select: { id: true, yearName: true, startDate: true } } } } },
  });
  return a ? { studentId: a.studentId, year: a.feeStructure?.academicYear || null } : null;
};

/**
 * The student's unpaid fees from academic years before this fee's year, oldest first:
 * [{ id, name, yearName, startDate, dueAmount }], plus the total.
 */
const previousYearDuesFor = async (db, assignment) => {
  const me = await yearOf(db, assignment.id);
  if (!me?.year) return { fees: [], total: 0 };
  const others = await db.studentFeeAssignment.findMany({
    where: {
      studentId: me.studentId,
      id: { not: assignment.id },
      dueAmount: { gt: 0 },
      feeStructure: { academicYear: { startDate: { lt: me.year.startDate } } },
    },
    select: { id: true, dueAmount: true, createdAt: true, feeStructure: { select: { name: true, dueDate: true, academicYear: { select: { yearName: true, startDate: true } } } } },
  });
  const fees = others
    .map((o) => ({ id: o.id, name: o.feeStructure.name, yearName: o.feeStructure.academicYear.yearName, startDate: o.feeStructure.academicYear.startDate, dueDate: o.feeStructure.dueDate, dueAmount: round2(o.dueAmount) }))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate) || new Date(a.dueDate) - new Date(b.dueDate));
  return { fees, total: round2(fees.reduce((s, f) => s + f.dueAmount, 0)), year: me.year };
};

/** The student's active exception (management approval), or null. */
const activeException = (db, studentId) => db.feeDuesException.findFirst({
  where: { studentId, revokedAt: null, validUntil: { gte: new Date() } },
  orderBy: { validUntil: 'desc' },
});

const yearsLabel = (fees) => [...new Set(fees.map((f) => f.yearName))].join(', ');

/**
 * What the previous-year rule means for paying this fee right now:
 *   { mode: 'NONE' }                      nothing to do (rule off, no dues, below minimum, exception)
 *   { mode: 'BLOCK', dues, message }      refused unless bypassed
 *   { mode: 'AUTO_ADJUST', dues }         the payment clears these first
 */
const previousDuesRule = async (db, { policy, assignment }) => {
  const rule = policy.previousYearDues || 'ALLOW';
  if (rule === 'ALLOW') return { mode: 'NONE' };
  const dues = await previousYearDuesFor(db, assignment);
  if (!(dues.total > 0.009) || dues.total < round2(policy.previousYearMinDue || 0)) return { mode: 'NONE', dues };
  const exception = await activeException(db, assignment.studentId);
  if (exception) return { mode: 'NONE', dues, exception };
  const message = `Previous year dues of ${inr(dues.total)} (${yearsLabel(dues.fees)}) must be cleared before paying this fee`;
  return { mode: rule, dues, message };
};

/**
 * Throws when the rule blocks this payment.
 *   channel        ONLINE | COUNTER (lump sum — can spread) | COUNTER_HEADS (head-wise — can't)
 *   overrideReason the fee office's reason; honoured only when previousYearOverride is on
 * Returns the rule (so AUTO_ADJUST callers can spread the money).
 */
const enforcePreviousDues = async (db, { policy, assignment, channel, overrideReason = null }) => {
  const r = await previousDuesRule(db, { policy, assignment });
  const blocks = r.mode === 'BLOCK' || (r.mode === 'AUTO_ADJUST' && channel === 'COUNTER_HEADS');
  if (!blocks) return r;
  if (overrideReason && channel !== 'ONLINE' && policy.previousYearOverride) return { ...r, overridden: true };
  const how = r.mode === 'AUTO_ADJUST'
    ? ' — collect them first (a lump-sum payment on this fee clears them automatically)'
    : channel === 'ONLINE' ? ' — please pay them first' : policy.previousYearOverride ? ' — collect them first, or give a reason to override' : ' — collect them first';
  const err = new BusinessRuleError(`${r.message}${how}`);
  err.details = { previousDues: r.dues };
  throw err;
};

/**
 * AUTO_ADJUST: how a payment of `amount` is spread — previous dues first (oldest year first),
 * the rest to the chosen fee. → { previous: [{ id, name, yearName, amount }], rest }
 */
const spreadOverPreviousDues = (rule, amount) => {
  let left = round2(amount);
  const previous = [];
  if (rule?.mode === 'AUTO_ADJUST') {
    for (const f of rule.dues.fees) {
      if (!(left > 0.009)) break;
      const use = round2(Math.min(left, f.dueAmount));
      if (use > 0) { previous.push({ id: f.id, name: f.name, yearName: f.yearName, amount: use }); left = round2(left - use); }
    }
  }
  return { previous, rest: left };
};

/**
 * Records the previous-dues part of an AUTO_ADJUST payment inside the caller's transaction:
 * one FeePayment + FeeReceipt per old fee, each applied to that fee's heads / instalments.
 *   base        fields copied onto every payment (mode, reference, receivedBy, remarks…)
 *   receiptNo   (i) → the receipt number for the i-th payment
 *   keyOf       (i) → its idempotency key (or null)
 */
const recordPreviousDuesPayments = async (tx, { institutionId, studentId, previous, base, receiptNo, keyOf = () => null }) => {
  const { applyToAssignment } = require('./feePolicy');
  const made = [];
  for (let i = 0; i < previous.length; i += 1) {
    const p = previous[i];
    const payment = await tx.feePayment.create({
      data: {
        ...base,
        institutionId,
        studentId,
        studentFeeAssignmentId: p.id,
        amountPaid: p.amount,
        creditAmount: 0,
        paymentStatus: 'SUCCESS',
        idempotencyKey: keyOf(i),
        remarks: `${base.remarks ? `${base.remarks} — ` : ''}Adjusted to previous year dues (${p.yearName})`,
      },
    });
    const receipt = await tx.feeReceipt.create({ data: { receiptNumber: receiptNo(i), institutionId, studentId, paymentId: payment.id, amount: p.amount } });
    await applyToAssignment(tx, { assignmentId: p.id, paymentId: payment.id, amount: p.amount });
    made.push({ fee: p.name, yearName: p.yearName, amount: p.amount, paymentId: payment.id, receiptNumber: receipt.receiptNumber });
  }
  return made;
};

module.exports = { previousYearDuesFor, previousDuesRule, enforcePreviousDues, spreadOverPreviousDues, recordPreviousDuesPayments, activeException };
