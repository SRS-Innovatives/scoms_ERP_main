/**
 * Institute Admin — Fee Policy (shared/fees/feePolicy.js): the institution's payment rules,
 * one fee's own rules, holds and exemptions, fee credit, and reminders. Admin-only like the
 * rest of the fee module; every change is audit-logged.
 */
const { Prisma } = require('@prisma/client');
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError } = require('../../../shared');
const {
  DEFAULT_POLICY, HOLD_TYPES, OVERRIDE_KEYS, ENUMS,
  parsePolicyInput, parseOverride, getFeePolicy, getFeeHolds, getFeeHoldsForStudents,
  creditBalance, addCredit, useCredit, siblingIds, round2, inr,
} = require('../../../shared/fees/feePolicy');
const { sendManualReminders, runInstitutionReminders, DEFAULT_MESSAGE, DEFAULT_SMS } = require('../../../shared/fees/feeReminders');

const audit = (req, action, entity, entityId, details) => prisma.auditLog.create({
  data: { institutionId: req.institutionId, userId: req.user.id, action, module: 'FEES', entity, entityId, newValues: JSON.stringify(details) },
}).catch(() => {});

const studentIn = async (studentId, institutionId) => {
  const s = await prisma.student.findFirst({ where: { id: studentId, institutionId }, select: { id: true, firstName: true, lastName: true, admissionNumber: true } });
  if (!s) throw new NotFoundError('Student not found');
  return s;
};

// ------------------------------------------------------------------ policy

/** GET /fees/policy — the policy (defaults filled in) and the choices for the form. */
const getPolicy = async (req, res, next) => {
  try {
    const policy = await getFeePolicy(prisma, req.institutionId);
    return sendSuccess(res, {
      policy,
      options: { ...ENUMS, holds: HOLD_TYPES, overrideKeys: OVERRIDE_KEYS, defaults: DEFAULT_POLICY, defaultReminderMessage: DEFAULT_MESSAGE, defaultSmsMessage: DEFAULT_SMS },
    }, 'Fee policy retrieved');
  } catch (err) {
    next(err);
  }
};

/** PUT /fees/policy — saves any of the policy fields. */
const updatePolicy = async (req, res, next) => {
  try {
    const data = parsePolicyInput(req.body);
    const before = await prisma.feePolicy.findUnique({ where: { institutionId: req.institutionId } });
    await prisma.feePolicy.upsert({
      where: { institutionId: req.institutionId },
      create: { institutionId: req.institutionId, ...data, updatedById: req.user.id },
      update: { ...data, updatedById: req.user.id },
    });
    audit(req, 'FEE_POLICY_UPDATED', 'FeePolicy', req.institutionId, { changed: data, before: before ? Object.fromEntries(Object.keys(data).map((k) => [k, before[k]])) : null });
    return sendSuccess(res, { policy: await getFeePolicy(prisma, req.institutionId) }, 'Fee policy saved');
  } catch (err) {
    next(err);
  }
};

/** PUT /fee-structures/:id/policy { policyOverride } — one fee's own rules (any status). */
const setStructurePolicy = async (req, res, next) => {
  try {
    const structure = await prisma.feeStructure.findFirst({ where: { id: req.params.id, institutionId: req.institutionId }, select: { id: true, name: true, policyOverride: true } });
    if (!structure) throw new NotFoundError('Fee structure not found');
    const override = parseOverride(req.body.policyOverride);
    const updated = await prisma.feeStructure.update({ where: { id: structure.id }, data: { policyOverride: override ?? Prisma.DbNull }, select: { id: true, name: true, policyOverride: true } });
    audit(req, 'FEE_STRUCTURE_POLICY_UPDATED', 'FeeStructure', structure.id, { before: structure.policyOverride, after: override });
    return sendSuccess(res, updated, override ? `"${structure.name}" now has its own payment rules` : `"${structure.name}" follows the Fee Policy`);
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------ one student

/** GET /fees/students/:studentId/policy-status — holds, credit balance + history, siblings. */
const getStudentPolicyStatus = async (req, res, next) => {
  try {
    const student = await studentIn(req.params.studentId, req.institutionId);
    const policy = await getFeePolicy(prisma, req.institutionId);
    const [holds, balance, ledger, sibIds, exemptions] = await Promise.all([
      getFeeHolds(prisma, { institutionId: req.institutionId, studentId: student.id, policy }),
      creditBalance(prisma, student.id),
      prisma.studentFeeCredit.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      siblingIds(prisma, student.id),
      prisma.feeHoldExemption.findMany({ where: { studentId: student.id, revokedAt: null }, orderBy: { createdAt: 'desc' } }),
    ]);
    const siblings = sibIds.length
      ? await prisma.student.findMany({ where: { id: { in: sibIds }, institutionId: req.institutionId }, select: { id: true, firstName: true, lastName: true, admissionNumber: true } })
      : [];
    return sendSuccess(res, {
      student,
      holds: { ...holds, labels: Object.fromEntries(holds.holds.map((h) => [h, HOLD_TYPES[h]])) },
      credit: { balance, ledger, canRefund: policy.creditRefundable, canTransfer: policy.creditSiblingTransfer, siblings },
      exemptions,
    }, 'Student fee status retrieved');
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------ holds

/** GET /fees/holds — every student currently held (when the policy has holds). */
const getHolds = async (req, res, next) => {
  try {
    const policy = await getFeePolicy(prisma, req.institutionId);
    if (!policy.holds.length) return sendSuccess(res, { enabled: false, rows: [] }, 'No holds are switched on in the Fee Policy');
    const owing = await prisma.studentFeeAssignment.findMany({
      where: { feeStructure: { institutionId: req.institutionId }, OR: [{ dueAmount: { gt: 0 } }, { lateFeeCharged: { gt: 0 } }], student: { status: 'ACTIVE' } },
      select: { studentId: true },
      distinct: ['studentId'],
      take: 3000,
    });
    // every student's holds in a few queries (shared/fees/feePolicy.js getFeeHoldsForStudents)
    const all = await getFeeHoldsForStudents(prisma, { institutionId: req.institutionId, studentIds: owing.map((o) => o.studentId), policy });
    const rows = [];
    for (const { studentId } of owing) {
      const h = all.get(studentId);
      // held now, or would be held but for an exemption
      if (h.holds.length === 0 && h.exemptTypes.length === 0) continue;
      rows.push({ studentId, ...h });
    }
    const students = await prisma.student.findMany({
      where: { id: { in: rows.map((r) => r.studentId) } },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true, course: { select: { name: true } }, section: { select: { name: true } } },
    });
    const byId = new Map(students.map((s) => [s.id, s]));
    rows.forEach((r) => { r.student = byId.get(r.studentId); });
    rows.sort((x, y) => y.amountToClear - x.amountToClear);
    return sendSuccess(res, { enabled: true, holdTypes: policy.holds, labels: HOLD_TYPES, rows }, 'Fee holds retrieved');
  } catch (err) {
    next(err);
  }
};

/** GET /fees/hold-exemptions?includeInactive=true */
const getExemptions = async (req, res, next) => {
  try {
    const now = new Date();
    const all = req.query.includeInactive === 'true';
    const rows = await prisma.feeHoldExemption.findMany({
      where: { institutionId: req.institutionId, ...(!all && { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }) },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return sendSuccess(res, rows.map((r) => ({ ...r, active: !r.revokedAt && (!r.expiresAt || r.expiresAt > now) })), 'Hold exemptions retrieved');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/hold-exemptions { studentId, holdTypes?, reason, expiresAt? } */
const createExemption = async (req, res, next) => {
  try {
    const { studentId, holdTypes, expiresAt } = req.body;
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new ValidationError('A reason is required');
    const student = await studentIn(studentId, req.institutionId);
    let types = null;
    if (Array.isArray(holdTypes) && holdTypes.length) {
      const bad = holdTypes.filter((h) => !HOLD_TYPES[h]);
      if (bad.length) throw new ValidationError(`Unknown hold: ${bad.join(', ')}`);
      types = [...new Set(holdTypes)];
    }
    let until = null;
    if (expiresAt) {
      until = new Date(expiresAt);
      if (Number.isNaN(until.getTime())) throw new ValidationError('expiresAt is not a valid date');
      until.setHours(23, 59, 59, 999);
      if (until < new Date()) throw new ValidationError('The expiry date is already past');
    }
    const row = await prisma.feeHoldExemption.create({
      data: { institutionId: req.institutionId, studentId: student.id, holdTypes: types ?? Prisma.DbNull, reason: reason.slice(0, 300), expiresAt: until, createdById: req.user.id },
    });
    audit(req, 'FEE_HOLD_EXEMPTED', 'Student', student.id, { holdTypes: types || 'ALL', reason, expiresAt: until });
    return sendSuccess(res, row, `${student.firstName} ${student.lastName} is exempt from ${types ? types.map((t) => HOLD_TYPES[t]).join(', ') : 'all fee holds'}${until ? ` until ${until.toLocaleDateString('en-IN')}` : ''}`, 201);
  } catch (err) {
    next(err);
  }
};

/** POST /fees/hold-exemptions/:id/revoke */
const revokeExemption = async (req, res, next) => {
  try {
    const row = await prisma.feeHoldExemption.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!row) throw new NotFoundError('Exemption not found');
    if (row.revokedAt) throw new BusinessRuleError('Already revoked');
    await prisma.feeHoldExemption.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    audit(req, 'FEE_HOLD_EXEMPTION_REVOKED', 'Student', row.studentId, { exemptionId: row.id });
    return sendSuccess(res, { id: row.id }, 'Exemption revoked');
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------ previous-year dues exceptions

/** GET /fees/dues-exceptions — students allowed to pay a later year's fee despite previous-year dues. */
const getDuesExceptions = async (req, res, next) => {
  try {
    const now = new Date();
    const all = req.query.includeInactive === 'true';
    const rows = await prisma.feeDuesException.findMany({
      where: { institutionId: req.institutionId, ...(!all && { revokedAt: null, validUntil: { gte: now } }) },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return sendSuccess(res, rows.map((r) => ({ ...r, active: !r.revokedAt && r.validUntil >= now })), 'Dues exceptions retrieved');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/dues-exceptions { studentId, reason, validUntil } — management approval, always with an end date. */
const createDuesException = async (req, res, next) => {
  try {
    const { studentId, validUntil } = req.body;
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new ValidationError('A reason is required (e.g. who approved it)');
    if (!validUntil) throw new ValidationError('An end date is required');
    const until = new Date(validUntil);
    if (Number.isNaN(until.getTime())) throw new ValidationError('validUntil is not a valid date');
    until.setHours(23, 59, 59, 999);
    if (until < new Date()) throw new ValidationError('The end date is already past');
    const student = await studentIn(studentId, req.institutionId);
    const row = await prisma.feeDuesException.create({
      data: { institutionId: req.institutionId, studentId: student.id, reason: reason.slice(0, 300), validUntil: until, createdById: req.user.id },
    });
    audit(req, 'FEE_DUES_EXCEPTION_GRANTED', 'Student', student.id, { reason, validUntil: until });
    return sendSuccess(res, row, `${student.firstName} ${student.lastName} may pay later fees despite previous-year dues until ${until.toLocaleDateString('en-IN')}`, 201);
  } catch (err) {
    next(err);
  }
};

const revokeDuesException = async (req, res, next) => {
  try {
    const row = await prisma.feeDuesException.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!row) throw new NotFoundError('Exception not found');
    if (row.revokedAt) throw new BusinessRuleError('Already revoked');
    await prisma.feeDuesException.update({ where: { id: row.id }, data: { revokedAt: new Date(), revokedById: req.user.id } });
    audit(req, 'FEE_DUES_EXCEPTION_REVOKED', 'Student', row.studentId, { exceptionId: row.id });
    return sendSuccess(res, { id: row.id }, 'Exception revoked');
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------ credit

/** GET /fees/credits — students holding fee credit. */
const getCredits = async (req, res, next) => {
  try {
    const sums = await prisma.studentFeeCredit.groupBy({ by: ['studentId'], where: { institutionId: req.institutionId }, _sum: { amount: true } });
    const withBalance = sums.filter((s) => round2(s._sum.amount || 0) > 0);
    const students = await prisma.student.findMany({
      where: { id: { in: withBalance.map((s) => s.studentId) } },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, course: { select: { name: true } } },
    });
    const byId = new Map(students.map((s) => [s.id, s]));
    const rows = withBalance.map((s) => ({ student: byId.get(s.studentId), balance: round2(s._sum.amount) })).sort((a, b) => b.balance - a.balance);
    return sendSuccess(res, { total: round2(rows.reduce((t, r) => t + r.balance, 0)), rows }, 'Fee credits retrieved');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/students/:studentId/credit/use { assignmentId?, amount? } */
const useStudentCredit = async (req, res, next) => {
  try {
    const student = await studentIn(req.params.studentId, req.institutionId);
    const { assignmentId } = req.body;
    if (assignmentId) {
      const a = await prisma.studentFeeAssignment.findFirst({ where: { id: assignmentId, studentId: student.id, feeStructure: { institutionId: req.institutionId } } });
      if (!a) throw new NotFoundError('Fee not found for this student');
      if (!(a.dueAmount > 0)) throw new BusinessRuleError('This fee is already paid');
    }
    const amount = req.body.amount === undefined || req.body.amount === '' ? null : round2(req.body.amount);
    if (amount !== null && !(amount > 0)) throw new ValidationError('Amount must be greater than zero');
    const balance = await creditBalance(prisma, student.id);
    if (!(balance > 0)) throw new BusinessRuleError('This student has no fee credit');
    if (amount !== null && amount > balance + 0.009) throw new ValidationError(`The credit balance is only ${inr(balance)}`);
    const made = await useCredit(prisma, { institutionId: req.institutionId, studentId: student.id, assignmentId: assignmentId || null, amount, userId: req.user.id, receivedBy: req.user.email });
    if (made.length === 0) throw new BusinessRuleError('There is nothing unpaid to use the credit on');
    const used = round2(made.reduce((t, m) => t + m.payment.amountPaid, 0));
    audit(req, 'FEE_CREDIT_USED', 'Student', student.id, { used, receipts: made.map((m) => m.receipt.receiptNumber) });
    return sendSuccess(res, { used, payments: made, balance: await creditBalance(prisma, student.id) }, `${inr(used)} paid from credit`);
  } catch (err) {
    next(err);
  }
};

/** POST /fees/students/:studentId/credit/refund { amount, reason, bankAccount? } */
const refundStudentCredit = async (req, res, next) => {
  try {
    const policy = await getFeePolicy(prisma, req.institutionId);
    if (!policy.creditRefundable) throw new BusinessRuleError('Fee credit cannot be refunded under your Fee Policy');
    const student = await studentIn(req.params.studentId, req.institutionId);
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new ValidationError('A reason is required');
    const amount = round2(req.body.amount);
    if (!(amount > 0)) throw new ValidationError('Amount must be greater than zero');
    const balance = await creditBalance(prisma, student.id);
    if (amount > balance + 0.009) throw new ValidationError(`The credit balance is only ${inr(balance)}`);
    const refund = await prisma.$transaction(async (tx) => {
      const r = await tx.feeRefund.create({
        data: { institutionId: req.institutionId, studentId: student.id, reason: `Fee credit refund — ${reason}`.slice(0, 300), amount, bankAccount: req.body.bankAccount || null, status: 'PROCESSED', processedAt: new Date() },
      });
      await addCredit(tx, { institutionId: req.institutionId, studentId: student.id, amount: -amount, type: 'REFUND', reason: reason.slice(0, 300), userId: req.user.id });
      return r;
    });
    audit(req, 'FEE_CREDIT_REFUNDED', 'Student', student.id, { amount, reason, refundId: refund.id });
    return sendSuccess(res, { refund, balance: await creditBalance(prisma, student.id) }, `${inr(amount)} credit refunded`);
  } catch (err) {
    next(err);
  }
};

/** POST /fees/students/:studentId/credit/transfer { toStudentId, amount, reason } */
const transferStudentCredit = async (req, res, next) => {
  try {
    const policy = await getFeePolicy(prisma, req.institutionId);
    if (!policy.creditSiblingTransfer) throw new BusinessRuleError('Moving credit to a sibling is switched off in your Fee Policy');
    const from = await studentIn(req.params.studentId, req.institutionId);
    const to = await studentIn(req.body.toStudentId, req.institutionId);
    if (!(await siblingIds(prisma, from.id)).includes(to.id)) throw new BusinessRuleError(`${to.firstName} ${to.lastName} is not a sibling (no shared parent) of ${from.firstName} ${from.lastName}`);
    const reason = String(req.body.reason || '').trim() || 'Sibling transfer';
    const amount = round2(req.body.amount);
    if (!(amount > 0)) throw new ValidationError('Amount must be greater than zero');
    const balance = await creditBalance(prisma, from.id);
    if (amount > balance + 0.009) throw new ValidationError(`The credit balance is only ${inr(balance)}`);
    await prisma.$transaction(async (tx) => {
      await addCredit(tx, { institutionId: req.institutionId, studentId: from.id, amount: -amount, type: 'TRANSFER_OUT', reason: `To ${to.firstName} ${to.lastName} — ${reason}`.slice(0, 300), userId: req.user.id });
      await addCredit(tx, { institutionId: req.institutionId, studentId: to.id, amount, type: 'TRANSFER_IN', reason: `From ${from.firstName} ${from.lastName} — ${reason}`.slice(0, 300), userId: req.user.id });
    });
    audit(req, 'FEE_CREDIT_TRANSFERRED', 'Student', from.id, { to: to.id, amount, reason });
    return sendSuccess(res, { balance: await creditBalance(prisma, from.id) }, `${inr(amount)} moved to ${to.firstName} ${to.lastName}`);
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------ reminders

/** POST /fees/reminders/send { assignmentIds, sms? } — "Send reminder now" (once a day per fee); sms also texts them. */
const sendReminders = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.assignmentIds) ? [...new Set(req.body.assignmentIds)].slice(0, 2000) : [];
    if (!ids.length) throw new ValidationError('Choose at least one fee');
    const sms = req.body.sms === true;
    const r = await sendManualReminders(req.institutionId, ids, { sms });
    audit(req, 'FEE_REMINDERS_SENT', 'StudentFeeAssignment', null, { requested: ids.length, sms, ...r });
    return sendSuccess(res, r, `${r.sent} reminder(s) sent${sms ? ` (${r.smsSent} SMS)` : ''}${r.skipped ? `, ${r.skipped} already reminded today` : ''}`);
  } catch (err) {
    next(err);
  }
};

/** POST /fees/reminders/run — runs today's scheduled reminders now. */
const runReminders = async (req, res, next) => {
  try {
    const policy = await getFeePolicy(prisma, req.institutionId);
    if (!policy.remindersEnabled && !policy.smsRemindersEnabled) throw new BusinessRuleError('Automatic reminders and SMS are switched off in the Fee Policy');
    const sent = await runInstitutionReminders(req.institutionId);
    return sendSuccess(res, { sent }, sent ? `${sent} reminder(s) sent` : 'Nothing is due for a reminder right now');
  } catch (err) {
    next(err);
  }
};

/** GET /fees/reminders/log — the latest reminders sent. */
const getReminderLog = async (req, res, next) => {
  try {
    const rows = await prisma.feeReminderLog.findMany({ where: { institutionId: req.institutionId }, orderBy: { createdAt: 'desc' }, take: 200 });
    const fees = await prisma.studentFeeAssignment.findMany({
      where: { id: { in: [...new Set(rows.map((r) => r.assignmentId))] } },
      select: { id: true, feeStructure: { select: { name: true } }, student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
    });
    const byId = new Map(fees.map((f) => [f.id, f]));
    return sendSuccess(res, rows.map((r) => ({ ...r, fee: byId.get(r.assignmentId)?.feeStructure?.name, student: byId.get(r.assignmentId)?.student })), 'Reminder log retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPolicy, updatePolicy, setStructurePolicy, getStudentPolicyStatus,
  getHolds, getExemptions, createExemption, revokeExemption,
  getCredits, useStudentCredit, refundStudentCredit, transferStudentCredit,
  sendReminders, runReminders, getReminderLog,
  getDuesExceptions, createDuesException, revokeDuesException,
};
