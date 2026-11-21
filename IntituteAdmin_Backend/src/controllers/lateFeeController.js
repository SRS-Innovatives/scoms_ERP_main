/**
 * Institute Admin — Late fees: see who owes one, collect it, or waive it.
 *
 * The late fee accrues automatically (shared/fees/lateFee.js: per day after the grace days,
 * up to the structure's maximum) and is kept separate from the fee itself. Only the
 * Institute Admin collects or waives it; each action is a LateFeeEntry (payments get their
 * own receipt number) plus an audit-log row.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, generateReceiptNumber } = require('../../../shared');
const { refreshLateFee, refreshLateFees, LATE_FEE_SELECT } = require('../../../shared/fees/lateFee');

const round2 = (n) => Math.round(n * 100) / 100;
const PAYMENT_MODES = ['CASH', 'CHEQUE', 'DD', 'BANK_TRANSFER', 'UPI_MANUAL', 'OTHER'];

const loadAssignment = (id, institutionId) => prisma.studentFeeAssignment.findFirst({
  where: { id, feeStructure: { institutionId } },
  include: {
    student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true } },
    feeStructure: { select: { name: true, lateFeePerDay: true, lateFeeGraceDays: true, lateFeeMaxAmount: true } },
  },
});

const audit = (req, action, entityId, details) => prisma.auditLog.create({
  data: { institutionId: req.institutionId, userId: req.user.id, action, module: 'FEES', entity: 'LateFee', entityId, newValues: JSON.stringify(details) },
}).catch(() => {});

/** GET /fees/late-fees?status=DUE (default) | ALL */
const getLateFees = async (req, res, next) => {
  try {
    const status = req.query.status === 'ALL' ? 'ALL' : 'DUE';
    // fees whose structure has a late fee and that are unpaid or already carry a late fee
    // one query for every candidate fee with all it needs, late fees worked out in memory and
    // written back only where they grew (shared/fees/lateFee.js refreshLateFees)
    const candidates = await prisma.studentFeeAssignment.findMany({
      where: {
        feeStructure: { institutionId: req.institutionId, lateFeePerDay: { gt: 0 } },
        OR: [{ dueAmount: { gt: 0 } }, { lateFeeCharged: { gt: 0 } }],
      },
      select: {
        ...LATE_FEE_SELECT,
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true } },
        feeStructure: { select: { ...LATE_FEE_SELECT.feeStructure.select, name: true } },
      },
      take: 5000,
    });
    const summaries = await refreshLateFees(prisma, candidates);
    const rows = [];
    for (const a of candidates) {
      const summary = summaries.get(a.id);
      if (!summary || summary.charged <= 0) continue;
      if (status === 'DUE' && summary.due <= 0) continue;
      rows.push({
        assignmentId: a.id,
        student: a.student,
        feeName: a.feeStructure.name,
        feeDue: a.dueAmount,
        rule: { perDay: a.feeStructure.lateFeePerDay, graceDays: a.feeStructure.lateFeeGraceDays, max: a.feeStructure.lateFeeMaxAmount },
        ...summary,
      });
    }
    rows.sort((x, y) => y.due - x.due);
    return sendSuccess(res, rows, 'Late fees retrieved');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/late-fees/:assignmentId/collect  { amount, paymentMode, remarks } */
const collectLateFee = async (req, res, next) => {
  try {
    const a = await loadAssignment(req.params.assignmentId, req.institutionId);
    if (!a) throw new NotFoundError('Fee not found');
    const summary = await refreshLateFee(prisma, a.id);
    const amount = round2(Number(req.body.amount ?? summary.due));
    const paymentMode = req.body.paymentMode || 'CASH';
    if (!PAYMENT_MODES.includes(paymentMode)) throw new ValidationError(`paymentMode must be one of ${PAYMENT_MODES.join(', ')}`);
    if (!(amount > 0)) throw new ValidationError('Amount must be greater than zero');
    if (amount > summary.due + 0.01) throw new ValidationError(`Amount ₹${amount} is more than the late fee due (₹${summary.due})`);

    const inst = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });
    const count = await prisma.lateFeeEntry.count({ where: { institutionId: req.institutionId, type: 'PAYMENT' } });
    const receiptNumber = generateReceiptNumber(`${inst?.code || 'SCOMS'}-LF`, count + 1);

    const entry = await prisma.$transaction(async (tx) => {
      const e = await tx.lateFeeEntry.create({
        data: {
          institutionId: req.institutionId, studentFeeAssignmentId: a.id, type: 'PAYMENT', amount, paymentMode,
          receiptNumber, reason: req.body.remarks ? String(req.body.remarks).slice(0, 300) : null, createdById: req.user.id,
        },
      });
      await tx.studentFeeAssignment.update({ where: { id: a.id }, data: { lateFeePaid: round2(a.lateFeePaid + amount) } });
      return e;
    });
    await audit(req, 'LATE_FEE_COLLECTED', a.id, { amount, receiptNumber, paymentMode });
    return sendSuccess(res, { entry, lateFee: await refreshLateFee(prisma, a.id) }, `Late fee of ₹${amount} collected — receipt ${receiptNumber}`, 201);
  } catch (err) {
    next(err);
  }
};

/** POST /fees/late-fees/:assignmentId/waive  { amount?, reason }  — waives the given amount, or all of it */
const waiveLateFee = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new ValidationError('A reason is required to waive a late fee');
    const a = await loadAssignment(req.params.assignmentId, req.institutionId);
    if (!a) throw new NotFoundError('Fee not found');
    const summary = await refreshLateFee(prisma, a.id);
    const amount = round2(req.body.amount === undefined || req.body.amount === '' ? summary.due : Number(req.body.amount));
    if (!(amount > 0)) throw new ValidationError('There is no late fee to waive');
    if (amount > summary.due + 0.01) throw new ValidationError(`Amount ₹${amount} is more than the late fee due (₹${summary.due})`);

    await prisma.$transaction([
      prisma.lateFeeEntry.create({
        data: { institutionId: req.institutionId, studentFeeAssignmentId: a.id, type: 'WAIVER', amount, reason: reason.slice(0, 300), createdById: req.user.id },
      }),
      prisma.studentFeeAssignment.update({ where: { id: a.id }, data: { lateFeeWaived: round2(a.lateFeeWaived + amount) } }),
    ]);
    await audit(req, 'LATE_FEE_WAIVED', a.id, { amount, reason });
    return sendSuccess(res, { lateFee: await refreshLateFee(prisma, a.id) }, `Late fee of ₹${amount} waived`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLateFees, collectLateFee, waiveLateFee };
