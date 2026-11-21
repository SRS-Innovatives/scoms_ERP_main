/**
 * Fee Policy — each institution's own rules for taking payments, extra money (credit),
 * holds while fees are unpaid, and reminders. Set once under Fees → Fee Policy; one fee
 * structure may override the payment rules (FeeStructure.policyOverride). No FeePolicy row
 * means today's behaviour exactly (every default below reproduces it).
 *
 * Payments (all three paths — admin counter, Collect Fee by head, student online — go
 * through planPayment / checkPartialRules):
 *   partialPayment  ALLOWED | NOT_ALLOWED (only whole instalments) | COUNTER_ONLY (online
 *                   payments must clear whole instalments; the counter takes any amount)
 *   minPayment*     NONE | FIXED ₹ | PERCENT of the next instalment (or of the fee when it
 *                   has no instalments); never more than what is actually due
 *   lateFeeOrder    SEPARATE (collected on its own, as today) | FIRST (each payment clears
 *                   the late fee before the fee) | LAST (whatever is left after the fee)
 *   oldestFeeFirst  an older unpaid fee must be cleared before a newer one
 *   previousYearDues  ALLOW | BLOCK | AUTO_ADJUST — the previous academic year's unpaid fees
 *                   (shared/fees/previousDues.js), with previousYearOverride / previousYearMinDue
 *   counterHeadChoice  the admin may choose which heads a counter payment goes to
 * The Institute Admin may bypass the partial / minimum / order rules for one payment by
 * giving a reason (audited). Students paying online never can.
 *
 * Extra money: excessPayment REJECT (as today) | CREDIT (kept as the student's fee credit,
 * StudentFeeCredit ledger). Credit is used AUTOmatically on the next dues or MANUALly by the
 * admin; it may be refunded or moved to a sibling when the policy allows.
 */
const { ValidationError, BusinessRuleError } = require('../errors/customErrors');

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const inr = (n) => `₹${round2(n).toLocaleString('en-IN')}`;

const HOLD_TYPES = {
  HALL_TICKET: 'hall ticket',
  RESULTS: 'results and mark card',
  CERTIFICATES: 'certificates (TC, bonafide and others)',
  LIBRARY: 'library books',
};

const DEFAULT_POLICY = Object.freeze({
  partialPayment: 'ALLOWED',
  minPaymentType: 'NONE',
  minPaymentValue: 0,
  counterHeadChoice: true,
  lateFeeOrder: 'SEPARATE',
  oldestFeeFirst: false,
  excessPayment: 'REJECT',
  creditUse: 'MANUAL',
  creditRefundable: true,
  creditSiblingTransfer: false,
  holds: [],
  holdTrigger: 'ANY_OVERDUE',
  holdDays: 0,
  holdAmount: 0,
  holdIncludeLateFee: true,
  remindersEnabled: false,
  reminderBeforeDays: 3,
  reminderOnDueDate: true,
  reminderAfterEveryDays: 7,
  reminderAfterMaxTimes: 3,
  reminderRecipients: 'BOTH',
  reminderMessage: null,
  autoAssignOnAdmission: false,
  autoAssignOnPromotion: false,
  autoAdjustOnServiceChange: false,
  midYearChange: 'PRORATA',
  onLeaving: 'KEEP',
  smsRemindersEnabled: false,
  smsOn: 'OVERDUE',
  smsRecipients: 'PARENT',
  smsMinDue: 0,
  smsMessage: null,
  previousYearDues: 'ALLOW',
  previousYearOverride: true,
  previousYearMinDue: 0,
  carryForward: 'KEEP',
  carryForwardLateFee: true,
  promotionWithDues: 'WARN',
});

const ENUMS = {
  partialPayment: ['ALLOWED', 'NOT_ALLOWED', 'COUNTER_ONLY'],
  minPaymentType: ['NONE', 'FIXED', 'PERCENT'],
  lateFeeOrder: ['SEPARATE', 'FIRST', 'LAST'],
  excessPayment: ['REJECT', 'CREDIT'],
  creditUse: ['AUTO', 'MANUAL'],
  holdTrigger: ['ANY_OVERDUE', 'OVERDUE_DAYS', 'AMOUNT'],
  reminderRecipients: ['STUDENT', 'PARENT', 'BOTH'],
  midYearChange: ['FULL', 'PRORATA', 'NEXT_TERM'],
  onLeaving: ['KEEP', 'STOP_FUTURE', 'WRITE_OFF'],
  smsOn: ['OVERDUE', 'ALL'],
  smsRecipients: ['PARENT', 'STUDENT', 'BOTH'],
  previousYearDues: ['ALLOW', 'BLOCK', 'AUTO_ADJUST'],
  carryForward: ['KEEP', 'MOVE'],
  promotionWithDues: ['ALLOW', 'WARN', 'BLOCK'],
};
const BOOLS = ['counterHeadChoice', 'oldestFeeFirst', 'creditRefundable', 'creditSiblingTransfer', 'holdIncludeLateFee', 'remindersEnabled', 'reminderOnDueDate', 'autoAssignOnAdmission', 'autoAssignOnPromotion', 'autoAdjustOnServiceChange', 'smsRemindersEnabled', 'previousYearOverride', 'carryForwardLateFee'];
const INTS = { holdDays: [0, 3650], reminderBeforeDays: [0, 60], reminderAfterEveryDays: [0, 90], reminderAfterMaxTimes: [0, 30] };
const MONEY = ['minPaymentValue', 'holdAmount', 'smsMinDue', 'previousYearMinDue'];

/** What one fee structure may override, and how it's validated. */
const OVERRIDE_KEYS = ['partialPayment', 'minPaymentType', 'minPaymentValue', 'lateFeeOrder', 'countsForHolds', 'remindersEnabled'];

const pickValue = (key, v) => {
  if (ENUMS[key]) {
    if (!ENUMS[key].includes(v)) throw new ValidationError(`${key} must be one of ${ENUMS[key].join(', ')}`);
    return v;
  }
  if (BOOLS.includes(key) || key === 'countsForHolds') {
    if (typeof v !== 'boolean') throw new ValidationError(`${key} must be true or false`);
    return v;
  }
  if (INTS[key]) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < INTS[key][0] || n > INTS[key][1]) throw new ValidationError(`${key} must be a whole number from ${INTS[key][0]} to ${INTS[key][1]}`);
    return n;
  }
  if (MONEY.includes(key)) {
    const n = round2(v);
    if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${key} must be 0 or more`);
    return n;
  }
  return v;
};

/** Validates PUT /fees/policy → the data to store (only known keys). */
const parsePolicyInput = (body = {}) => {
  const out = {};
  for (const key of Object.keys(DEFAULT_POLICY)) {
    if (body[key] === undefined) continue;
    if (key === 'holds') {
      if (!Array.isArray(body.holds)) throw new ValidationError('holds must be a list');
      const bad = body.holds.filter((h) => !HOLD_TYPES[h]);
      if (bad.length) throw new ValidationError(`Unknown hold: ${bad.join(', ')} (allowed: ${Object.keys(HOLD_TYPES).join(', ')})`);
      out.holds = [...new Set(body.holds)];
    } else if (key === 'smsMessage') {
      const m = body.smsMessage === null ? null : String(body.smsMessage).trim();
      if (m && m.length > 300) throw new ValidationError('The SMS message must be at most 300 characters (2 SMS)');
      out.smsMessage = m || null;
    } else if (key === 'reminderMessage') {
      const m = body.reminderMessage === null ? null : String(body.reminderMessage).trim();
      if (m && m.length > 500) throw new ValidationError('The reminder message must be at most 500 characters');
      out.reminderMessage = m || null;
    } else {
      out[key] = pickValue(key, body[key]);
    }
  }
  const merged = { ...DEFAULT_POLICY, ...out };
  if (merged.minPaymentType === 'PERCENT' && merged.minPaymentValue > 100) throw new ValidationError('A minimum percentage cannot be more than 100');
  return out;
};

/** Validates a fee structure's override (null / {} clears it). */
const parseOverride = (input) => {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('policyOverride must be an object');
  const out = {};
  for (const [key, v] of Object.entries(input)) {
    if (v === null || v === undefined || v === '') continue;
    if (!OVERRIDE_KEYS.includes(key)) throw new ValidationError(`${key} cannot be set per fee (allowed: ${OVERRIDE_KEYS.join(', ')})`);
    out[key] = pickValue(key, v);
  }
  if (out.minPaymentType === 'PERCENT' && out.minPaymentValue > 100) throw new ValidationError('A minimum percentage cannot be more than 100');
  return Object.keys(out).length ? out : null;
};

/** The institution's policy, with defaults for anything not set. Read through the hot cache
 * (dropped the moment FeePolicy is written — shared/utils/hotCache.js) except inside a
 * transaction, which must see its own writes. */
const getFeePolicy = async (db, institutionId) => {
  const prisma = require('../database/client');
  if (db !== prisma) return loadFeePolicy(db, institutionId);
  const { cached } = require('../utils/hotCache');
  const p = await cached('feePolicy', institutionId, () => loadFeePolicy(db, institutionId));
  return { ...p, holds: [...p.holds] }; // callers get their own copy
};

const loadFeePolicy = async (db, institutionId) => {
  const row = await db.feePolicy.findUnique({ where: { institutionId } });
  if (!row) return { ...DEFAULT_POLICY, holds: [], configured: false };
  const policy = { configured: true };
  for (const key of Object.keys(DEFAULT_POLICY)) policy[key] = row[key] ?? DEFAULT_POLICY[key];
  policy.holds = Array.isArray(row.holds) ? row.holds : [];
  policy.updatedAt = row.updatedAt;
  return policy;
};

/** The policy as it applies to one fee (its structure's override on top). */
const effectivePolicy = (policy, structure) => {
  const o = structure?.policyOverride && typeof structure.policyOverride === 'object' ? structure.policyOverride : {};
  const merged = { ...policy };
  for (const key of OVERRIDE_KEYS) if (o[key] !== undefined && o[key] !== null) merged[key] = o[key];
  if (merged.countsForHolds === undefined) merged.countsForHolds = true;
  return merged;
};

// ------------------------------------------------------------------ payments

/** Splits a payment into the late-fee part, the fee part, and any extra (credit). */
const splitAmount = (policy, { amount, feeDue, lateDue }) => {
  let rest = round2(amount);
  let late = 0;
  let fee = 0;
  const lateable = policy.lateFeeOrder === 'SEPARATE' ? 0 : round2(lateDue || 0);
  if (policy.lateFeeOrder === 'FIRST') {
    late = Math.min(rest, lateable); rest = round2(rest - late);
    fee = Math.min(rest, feeDue); rest = round2(rest - fee);
  } else {
    fee = Math.min(rest, feeDue); rest = round2(rest - fee);
    if (policy.lateFeeOrder === 'LAST') { late = Math.min(rest, lateable); rest = round2(rest - late); }
  }
  return { fee: round2(fee), late: round2(late), credit: round2(Math.max(0, rest)), lateable };
};

/** The amounts that clear whole instalments, in order (1st, 1st+2nd, …), or [the whole due]. */
const wholeInstalmentAmounts = (feeDue, installments) => {
  const open = (installments || [])
    .filter((i) => round2(i.amount - (i.paidAmount || 0)) > 0)
    .sort((a, b) => a.installmentNumber - b.installmentNumber);
  if (open.length === 0) return [round2(feeDue)];
  let sum = 0;
  return open.map((i) => { sum = round2(sum + i.amount - (i.paidAmount || 0)); return Math.min(sum, round2(feeDue)); });
};

/** The minimum this payment must be (0 = no minimum). */
const minimumPayment = (policy, { feeDue, installments, lateFirst = 0 }) => {
  if (policy.minPaymentType === 'NONE' || !(policy.minPaymentValue > 0)) return 0;
  const payable = round2(feeDue + lateFirst);
  if (policy.minPaymentType === 'FIXED') return Math.min(round2(policy.minPaymentValue), payable);
  const next = wholeInstalmentAmounts(feeDue, installments)[0] || feeDue;
  return Math.min(round2((next * policy.minPaymentValue) / 100 + lateFirst), payable);
};

/**
 * Throws when this payment breaks the partial-payment or minimum rules.
 *   feeAmount  the part going to the fee; total = the whole payment
 *   channel    COUNTER | ONLINE
 */
const checkPartialRules = (policy, { feeDue, installments, feeAmount, total, lateFirst = 0, channel }) => {
  if (feeAmount >= feeDue - 0.009) return; // clears the fee — nothing partial about it
  const wholeOnly = policy.partialPayment === 'NOT_ALLOWED' || (policy.partialPayment === 'COUNTER_ONLY' && channel === 'ONLINE');
  if (wholeOnly) {
    const allowed = wholeInstalmentAmounts(feeDue, installments);
    if (!allowed.some((a) => Math.abs(a - feeAmount) < 0.01)) {
      const options = allowed.slice(0, 3).map((a, i) => `${inr(a + lateFirst)}${allowed.length > 1 ? ` (${i + 1} instalment${i ? 's' : ''})` : ''}`).join(', ');
      throw new BusinessRuleError(`Part payments are not accepted${policy.partialPayment === 'COUNTER_ONLY' ? ' online' : ''} — pay ${allowed.length > 1 ? 'whole instalments' : 'the full amount'}: ${options}${allowed.length > 3 ? ' …' : ''}`);
    }
  }
  const min = minimumPayment(policy, { feeDue, installments, lateFirst });
  if (min > 0 && total < min - 0.009) throw new BusinessRuleError(`The minimum payment is ${inr(min)}`);
};

/** The student's other fee that must be cleared first (oldestFeeFirst), or null. */
const olderUnpaidFee = async (db, assignment, clearedIds = []) => {
  const own = await firstDueDate(db, assignment.id);
  if (!own) return null;
  const others = await db.studentFeeAssignment.findMany({
    where: { studentId: assignment.studentId, id: { notIn: [assignment.id, ...clearedIds] }, dueAmount: { gt: 0 } },
    select: { id: true, dueAmount: true, feeStructure: { select: { name: true } } },
  });
  let best = null;
  for (const o of others) {
    const d = await firstDueDate(db, o.id);
    if (d && d < own && (!best || d < best.date)) best = { ...o, date: d };
  }
  return best;
};

/** The earliest due date still unpaid on a fee (its first open instalment, or the fee's date). */
const firstDueDate = async (db, assignmentId) => {
  const a = await db.studentFeeAssignment.findUnique({
    where: { id: assignmentId },
    select: { dueAmount: true, feeStructure: { select: { dueDate: true } }, installments: { where: { status: { not: 'PAID' } }, select: { dueDate: true }, orderBy: { dueDate: 'asc' }, take: 1 } },
  });
  if (!a || !(a.dueAmount > 0)) return null;
  return new Date(a.installments[0]?.dueDate || a.feeStructure.dueDate);
};

/**
 * Plans one lump-sum payment against a fee: validates it under the policy and returns
 * { fee, late, credit } — how much goes to the fee, to its late fee, and to credit.
 *   overrideReason  the admin's reason to bypass the partial / minimum / order rules
 *   skipRules       true when confirming an online payment already checked at initiate
 *   clearedIds      fees this same payment fully clears first (AUTO_ADJUST) — not "older unpaid"
 */
const planPayment = async (db, { policy, assignment, installments, lateDue, amount, channel, overrideReason = null, skipRules = false, clearedIds = [] }) => {
  const total = round2(amount);
  if (!(total > 0)) throw new ValidationError('Amount must be greater than zero');
  const feeDue = round2(assignment.dueAmount);
  const split = splitAmount(policy, { amount: total, feeDue, lateDue });
  if (split.credit > 0.009 && policy.excessPayment !== 'CREDIT') {
    const max = round2(feeDue + split.lateable);
    throw new ValidationError(`Amount ₹${total} exceeds the outstanding due of ₹${max}`);
  }
  if (skipRules) return split;
  // previous academic year's dues (BLOCK) — its own override switch, so it is checked before
  // the general override below (shared/fees/previousDues.js)
  const { enforcePreviousDues } = require('./previousDues');
  await enforcePreviousDues(db, { policy, assignment, channel, overrideReason });
  if (overrideReason) return split;

  const lateFirst = policy.lateFeeOrder === 'FIRST' ? split.lateable : 0;
  checkPartialRules(policy, { feeDue, installments, feeAmount: split.fee, total, lateFirst, channel });
  if (policy.oldestFeeFirst && split.fee > 0) {
    const older = await olderUnpaidFee(db, assignment, clearedIds);
    if (older) throw new BusinessRuleError(`Clear the older fee "${older.feeStructure.name}" (${inr(older.dueAmount)} due) first`);
  }
  return split;
};

/** Rejects a head-wise counter payment that skips an earlier head (counterHeadChoice off). */
const checkHeadOrder = (orderedItems, allocations) => {
  const byItem = new Map(allocations.map((a) => [a.studentFeeItemId, round2(a.amount)]));
  let open = null; // the first head left with something unpaid after this payment
  for (const item of orderedItems) {
    const paying = byItem.get(item.id) || 0;
    if (open && paying > 0) throw new BusinessRuleError(`Payments go to fee heads in order — clear "${open.feeHeadName}" (${inr(open.left)} left) first`);
    const left = round2(item.dueAmount - paying);
    if (!open && left > 0.009) open = { feeHeadName: item.feeHeadName, left };
  }
};

/** Brings an assignment's totals up to date for a fee payment and spreads it over heads. */
const applyToAssignment = async (tx, { assignmentId, paymentId, amount }) => {
  const { allocatePaymentToItems } = require('./feeItems');
  const a = await tx.studentFeeAssignment.findUnique({ where: { id: assignmentId }, select: { totalAmount: true, discountAmount: true, paidAmount: true } });
  const paid = round2(a.paidAmount + amount);
  const due = round2(Math.max(0, a.totalAmount - a.discountAmount - paid));
  await tx.studentFeeAssignment.update({ where: { id: assignmentId }, data: { paidAmount: paid, dueAmount: due, status: due <= 0 ? 'PAID' : 'PARTIAL' } });
  await allocatePaymentToItems(tx, { assignmentId, paymentId, amount });
};

/** Records the late-fee part of a payment (a LateFeeEntry, like collecting it separately). */
const recordLatePart = async (tx, { institutionId, assignmentId, amount, paymentMode, receiptNumber, userId }) => {
  if (!(amount > 0)) return null;
  const a = await tx.studentFeeAssignment.findUnique({ where: { id: assignmentId }, select: { lateFeePaid: true } });
  const mode = ['CASH', 'CHEQUE', 'DD', 'BANK_TRANSFER', 'UPI_MANUAL', 'OTHER'].includes(paymentMode) ? paymentMode : 'OTHER';
  const entry = await tx.lateFeeEntry.create({
    data: { institutionId, studentFeeAssignmentId: assignmentId, type: 'PAYMENT', amount: round2(amount), paymentMode: mode, receiptNumber: `${receiptNumber}-LF`, reason: 'Paid with the fee', createdById: userId || null },
  });
  await tx.studentFeeAssignment.update({ where: { id: assignmentId }, data: { lateFeePaid: round2(a.lateFeePaid + amount) } });
  return entry;
};

// ------------------------------------------------------------------ credit

const creditBalance = async (db, studentId) => {
  const agg = await db.studentFeeCredit.aggregate({ where: { studentId }, _sum: { amount: true } });
  return round2(agg._sum.amount || 0);
};

const addCredit = (tx, { institutionId, studentId, amount, type = 'CREDIT', feePaymentId = null, reason = null, userId = null }) =>
  tx.studentFeeCredit.create({ data: { institutionId, studentId, type, amount: round2(amount), feePaymentId, reason, createdById: userId } });

/**
 * Pays a student's unpaid fees from their credit — one CREDIT-mode payment (with its own
 * receipt) per fee, oldest due first, or only `assignmentId`. `amount` caps the total used.
 * Returns the payments made.
 */
const useCredit = async (db, { institutionId, studentId, assignmentId = null, amount = null, userId = null, receivedBy = 'Fee credit' }) => {
  const { generateReceiptNumber } = require('../utils/idGenerators');
  let balance = await creditBalance(db, studentId);
  if (amount !== null) balance = Math.min(balance, round2(amount));
  if (!(balance > 0)) return [];
  const fees = await db.studentFeeAssignment.findMany({
    where: { studentId, dueAmount: { gt: 0 }, feeStructure: { institutionId }, ...(assignmentId && { id: assignmentId }) },
    select: { id: true, dueAmount: true },
  });
  const dated = [];
  for (const f of fees) dated.push({ ...f, date: (await firstDueDate(db, f.id)) || new Date(8.64e15) });
  dated.sort((x, y) => x.date - y.date);

  const inst = await db.institution.findUnique({ where: { id: institutionId }, select: { code: true } });
  const made = [];
  for (const f of dated) {
    if (!(balance > 0)) break;
    const use = round2(Math.min(balance, f.dueAmount));
    if (!(use > 0)) continue;
    const count = await db.feeReceipt.count({ where: { institutionId } });
    const receiptNumber = generateReceiptNumber(inst?.code || 'SCOMS', count + 1);
    const result = await db.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: { institutionId, studentId, studentFeeAssignmentId: f.id, amountPaid: use, paymentMode: 'CREDIT', paymentStatus: 'SUCCESS', receivedBy, remarks: 'Paid from fee credit' },
      });
      const receipt = await tx.feeReceipt.create({ data: { receiptNumber, institutionId, studentId, paymentId: payment.id, amount: use } });
      await addCredit(tx, { institutionId, studentId, amount: -use, type: 'USE', feePaymentId: payment.id, reason: 'Used for fee', userId });
      await applyToAssignment(tx, { assignmentId: f.id, paymentId: payment.id, amount: use });
      return { payment, receipt };
    });
    made.push(result);
    balance = round2(balance - use);
  }
  return made;
};

/** When the policy says AUTO, uses any credit on the student's unpaid fees. */
const autoApplyCredit = async (db, { institutionId, studentId, policy = null }) => {
  const p = policy || (await getFeePolicy(db, institutionId));
  if (p.creditUse !== 'AUTO') return [];
  if (!((await creditBalance(db, studentId)) > 0)) return [];
  return useCredit(db, { institutionId, studentId, receivedBy: 'Fee credit (automatic)' });
};

/** Students who share a parent with this one. */
const siblingIds = async (db, studentId) => {
  const links = await db.parentStudent.findMany({ where: { studentId }, select: { parentId: true } });
  if (links.length === 0) return [];
  const sibs = await db.parentStudent.findMany({ where: { parentId: { in: links.map((l) => l.parentId) }, studentId: { not: studentId } }, select: { studentId: true } });
  return [...new Set(sibs.map((s) => s.studentId))];
};

// ------------------------------------------------------------------ overdue & holds

/** Overdue amount of one fee today: open instalments past their date (or the fee past its date). */
const overdueOf = (a, today = startOfDay(new Date())) => {
  if (!(a.dueAmount > 0)) return { amount: 0, since: null };
  const inst = (a.installments || []).filter((i) => i.status !== 'PAID');
  if ((a.installments || []).length) {
    const late = inst.filter((i) => startOfDay(i.dueDate) < today);
    const amount = round2(late.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0));
    const since = late.length ? late.map((i) => new Date(i.dueDate)).sort((x, y) => x - y)[0] : null;
    return { amount: Math.min(amount, round2(a.dueAmount)), since };
  }
  const due = a.feeStructure?.dueDate ? startOfDay(a.feeStructure.dueDate) : null;
  return due && due < today ? { amount: round2(a.dueAmount), since: due } : { amount: 0, since: null };
};

/**
 * Which fee holds apply to a student right now.
 * → { holds: [types blocked], overdue, lateFeeDue, amountToClear, since, exemptTypes }
 */
const getFeeHolds = async (db, { institutionId, studentId, policy = null }) => (
  (await getFeeHoldsForStudents(db, { institutionId, studentIds: [studentId], policy })).get(studentId)
);

/**
 * getFeeHolds for many students at once — three queries in all (their fees, late fees
 * written back only where they grew, exemptions) however many students, instead of several
 * per student. Returns Map(studentId → holds), same shape as getFeeHolds.
 */
const getFeeHoldsForStudents = async (db, { institutionId, studentIds, policy = null }) => {
  const p = policy || (await getFeePolicy(db, institutionId));
  const empty = () => ({ holds: [], overdue: 0, lateFeeDue: 0, amountToClear: 0, since: null, exemptTypes: [] });
  const out = new Map(studentIds.map((id) => [id, empty()]));
  if (!p.holds.length || studentIds.length === 0) return out;
  const { refreshLateFees, LATE_FEE_SELECT } = require('./lateFee');
  const fees = await db.studentFeeAssignment.findMany({
    where: { studentId: { in: studentIds }, feeStructure: { institutionId }, OR: [{ dueAmount: { gt: 0 } }, { lateFeeCharged: { gt: 0 } }] },
    select: {
      ...LATE_FEE_SELECT,
      studentId: true,
      feeStructure: { select: { ...LATE_FEE_SELECT.feeStructure.select, policyOverride: true } },
      installments: { select: { amount: true, paidAmount: true, dueDate: true, status: true } },
    },
  });
  const counted = fees.filter((f) => effectivePolicy(p, f.feeStructure).countsForHolds !== false);
  const late = p.holdIncludeLateFee ? await refreshLateFees(db, counted) : new Map();

  const totals = new Map();
  for (const f of counted) {
    const t = totals.get(f.studentId) || { overdue: 0, lateFeeDue: 0, since: null };
    const o = overdueOf(f);
    t.overdue = round2(t.overdue + o.amount);
    if (o.since && (!t.since || o.since < t.since)) t.since = o.since;
    if (p.holdIncludeLateFee) t.lateFeeDue = round2(t.lateFeeDue + (late.get(f.id)?.due || 0));
    totals.set(f.studentId, t);
  }

  const triggered = [];
  for (const id of studentIds) {
    const { overdue = 0, lateFeeDue = 0, since = null } = totals.get(id) || {};
    const owed = round2(overdue + lateFeeDue);
    let hit = false;
    if (p.holdTrigger === 'ANY_OVERDUE') hit = owed > 0;
    else if (p.holdTrigger === 'OVERDUE_DAYS') hit = overdue > 0 && since && Math.floor((startOfDay(new Date()) - startOfDay(since)) / DAY) >= p.holdDays;
    else if (p.holdTrigger === 'AMOUNT') hit = owed > 0 && owed >= p.holdAmount;
    if (hit) triggered.push(id);
    out.set(id, { ...empty(), overdue, lateFeeDue, since, owed });
  }

  const now = new Date();
  const triggeredSet = new Set(triggered);
  const exemptions = triggered.length ? await db.feeHoldExemption.findMany({
    where: { studentId: { in: triggered }, institutionId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { studentId: true, holdTypes: true },
  }) : [];
  for (const id of studentIds) {
    const r = out.get(id);
    const { owed } = r;
    delete r.owed;
    if (!triggeredSet.has(id)) continue;
    const mine = exemptions.filter((e) => e.studentId === id);
    const exemptAll = mine.some((e) => !Array.isArray(e.holdTypes) || e.holdTypes.length === 0);
    const exemptTypes = exemptAll ? [...p.holds] : [...new Set(mine.flatMap((e) => e.holdTypes))];
    out.set(id, { holds: p.holds.filter((h) => !exemptTypes.includes(h)), overdue: r.overdue, lateFeeDue: r.lateFeeDue, amountToClear: owed, since: r.since, exemptTypes });
  }
  return out;
};

/** Throws a clear message when `type` is held for this student. */
const assertNoFeeHold = async (db, { institutionId, studentId, type, forStudent = false }) => {
  const h = await getFeeHolds(db, { institutionId, studentId });
  if (!h.holds.includes(type)) return h;
  const what = HOLD_TYPES[type];
  throw new BusinessRuleError(forStudent
    ? `Your ${what} ${type === 'LIBRARY' ? 'are' : 'is'} on hold because of unpaid fees. Pay ${inr(h.amountToClear)} to release it, or contact the fee office.`
    : `This student's ${what} ${type === 'LIBRARY' ? 'are' : 'is'} on hold for unpaid fees (${inr(h.amountToClear)} overdue). Collect the fee or add a hold exemption under Fees → Fee Policy.`);
};

module.exports = {
  DEFAULT_POLICY, HOLD_TYPES, OVERRIDE_KEYS, ENUMS,
  parsePolicyInput, parseOverride, getFeePolicy, effectivePolicy,
  splitAmount, wholeInstalmentAmounts, minimumPayment, checkPartialRules, planPayment, checkHeadOrder, olderUnpaidFee, firstDueDate,
  applyToAssignment, recordLatePart,
  creditBalance, addCredit, useCredit, autoApplyCredit, siblingIds,
  overdueOf, getFeeHolds, getFeeHoldsForStudents, assertNoFeeHold, round2, inr,
};
