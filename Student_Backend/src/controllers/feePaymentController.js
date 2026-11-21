/**
 * Student Fee Overview & Razorpay Payment Gateway Controller
 *
 * Every fee assignment lookup here is scoped to req.user.studentId (and, transitively,
 * the assignment's institution) — a student can only ever see or pay their own fee
 * assignments, never one reached by guessing another student's assignment id. Payment
 * verification runs the real Razorpay HMAC check (shared/utils/paymentGateway) in both
 * live and simulated-gateway mode, so a forged payment id can't mark any assignment paid.
 */
const {
  prisma,
  sendSuccess,
  generateReceiptNumber,
  PaymentError,
  NotFoundError,
  ValidationError,
  paymentGateway,
} = require('../../../shared');
const { attachInstallments } = require('../../../shared/fees/feeView');
const { isFeatureOn } = require('../../../shared/utils/featureFlags');
const { refreshLateFee, lateFeeSummary } = require('../../../shared/fees/lateFee');
const {
  getFeePolicy, effectivePolicy, planPayment, applyToAssignment, recordLatePart, addCredit, autoApplyCredit, round2,
  wholeInstalmentAmounts, minimumPayment, creditBalance, getFeeHolds, HOLD_TYPES,
} = require('../../../shared/fees/feePolicy');
const { previousDuesRule, spreadOverPreviousDues, recordPreviousDuesPayments } = require('../../../shared/fees/previousDues');

/** The fee with what the policy needs (its override and instalments). */
const loadForPolicy = (id) => prisma.studentFeeAssignment.findUnique({
  where: { id },
  include: { feeStructure: { select: { policyOverride: true } }, installments: true },
});

const getFeesOverview = async (req, res, next) => {
  try {
    // Fee Policy "use credit automatically": settle new dues from any credit first
    await autoApplyCredit(prisma, { institutionId: req.institutionId, studentId: req.user.studentId });
    const feeAssignments = await prisma.studentFeeAssignment.findMany({
      where: { studentId: req.user.studentId },
      include: {
        feeStructure: true,
        payments: { include: { receipt: true } },
      },
    });
    // each fee's instalments (due dates, paid, which heads they cover)
    await attachInstallments(prisma, feeAssignments);
    // each fee's late fee, brought up to date (payable at the fee office)
    for (const a of feeAssignments) a.lateFee = await refreshLateFee(prisma, a.id);

    return sendSuccess(res, feeAssignments, 'Fee ledger retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * The "Fee Overview" menu badge — instead of a fixed "Pending" shown to everyone:
 *   overdue  a fee (or one of its instalments) is past its due date and still unpaid
 *   due      something is unpaid but not late yet
 *   (none)   everything is paid
 * Light on purpose (no late-fee recalculation): the sidebar asks for it on every page change.
 */
const getFeeBadge = async (req, res, next) => {
  try {
    const fees = await prisma.studentFeeAssignment.findMany({
      where: { studentId: req.user.studentId, dueAmount: { gt: 0 } },
      select: {
        dueAmount: true, lateFeeCharged: true, lateFeeWaived: true, lateFeePaid: true,
        feeStructure: { select: { dueDate: true } },
        installments: { select: { amount: true, paidAmount: true, dueDate: true, status: true } },
      },
    });
    const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    let totalDue = 0;
    let overdue = false;
    for (const f of fees) {
      totalDue += f.dueAmount + Math.max(0, f.lateFeeCharged - f.lateFeeWaived - f.lateFeePaid);
      const open = f.installments.length
        ? f.installments.filter((i) => i.status !== 'PAID' && i.amount - i.paidAmount > 0.005).map((i) => i.dueDate)
        : [f.feeStructure.dueDate];
      if (open.some((d) => d && new Date(d) < today)) overdue = true;
    }
    totalDue = Math.round(totalDue * 100) / 100;
    return sendSuccess(res, { pendingFees: fees.length, totalDue, overdue, state: overdue ? 'OVERDUE' : totalDue > 0 ? 'DUE' : 'PAID' }, 'Fee badge retrieved');
  } catch (err) {
    next(err);
  }
};

const initiateOnlinePayment = async (req, res, next) => {
  try {
    // Feature Flag "Online fee payments" (Super Admin) — no new online payments while off
    // (verify below is never blocked, so a payment already in progress still completes)
    if (!(await isFeatureOn('online_payments'))) throw new PaymentError('Online payments are switched off right now. Please pay at the fee office.');
    const { studentFeeAssignmentId, amount } = req.body;
    if (!studentFeeAssignmentId || !amount) throw new ValidationError('studentFeeAssignmentId and amount are required');

    // Ownership check — the assignment must belong to the caller, not just exist.
    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: studentFeeAssignmentId, studentId: req.user.studentId },
    });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');

    if (!(Number(amount) > 0)) throw new ValidationError('Amount must be greater than zero');
    // the institution's Fee Policy: part payments, minimum, late fee first/last, older fee
    // first, extra money as credit — checked here, before the student is charged
    const lateFee = await refreshLateFee(prisma, assignment.id);
    const full = await loadForPolicy(assignment.id);
    const policy = effectivePolicy(await getFeePolicy(prisma, req.institutionId), full.feeStructure);
    // previous academic year's dues: BLOCK refuses (inside planPayment); AUTO_ADJUST sends the
    // money to them first — only the rest is checked against this fee (shared/fees/previousDues.js)
    const pyRule = await previousDuesRule(prisma, { policy, assignment: full });
    const spread = spreadOverPreviousDues(pyRule, amount);
    const clearedIds = spread.previous.filter((p) => p.amount >= (pyRule.dues.fees.find((x) => x.id === p.id)?.dueAmount || 0) - 0.009).map((p) => p.id);
    try {
      if (!spread.previous.length || spread.rest > 0.009) {
        await planPayment(prisma, { policy, assignment: full, installments: full.installments, lateDue: lateFee.due, amount: spread.rest, channel: 'ONLINE', clearedIds });
      }
    } catch (e) {
      if (e instanceof ValidationError && /exceeds/.test(e.message)) {
        const previous = round2(spread.previous.reduce((t, p) => t + p.amount, 0));
        throw new ValidationError(`Amount exceeds the outstanding due amount of ₹${round2(previous + full.dueAmount + (policy.lateFeeOrder === 'SEPARATE' ? 0 : lateFee.due))}${previous ? ' (including previous year dues)' : ''}`);
      }
      throw e;
    }

    const order = await paymentGateway.createOrder(Number(amount));
    // fixes WHO pays, WHICH fee and HOW MUCH for this order — the confirm step credits this
    order.orderToken = paymentGateway.createOrderToken({
      orderId: order.orderId,
      studentId: req.user.studentId,
      assignmentId: assignment.id,
      amount: Number(amount),
    });
    return sendSuccess(res, order, 'Payment order created successfully');
  } catch (err) {
    next(err);
  }
};

const verifyOnlinePayment = async (req, res, next) => {
  try {
    const {
      studentFeeAssignmentId,
      orderToken,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!studentFeeAssignmentId) throw new ValidationError('studentFeeAssignmentId is required');

    // The amount comes ONLY from the signed order token minted when this order was created
    // — never from the browser. The token must be for this very order, fee and student.
    const token = paymentGateway.readOrderToken(orderToken);
    if (!token || token.orderId !== razorpayOrderId || token.assignmentId !== studentFeeAssignmentId || token.studentId !== req.user.studentId) {
      throw new PaymentError('This payment could not be matched to the order you started. Please start the payment again.');
    }
    const amountPaid = token.amount;

    // A Razorpay payment is credited once — a repeated confirm returns the original receipt
    if (razorpayPaymentId) {
      const already = await prisma.feePayment.findUnique({
        where: { idempotencyKey: `razorpay:${razorpayPaymentId}` },
        include: { receipt: true },
      });
      if (already) {
        if (already.studentId !== req.user.studentId) throw new PaymentError('This payment belongs to another account');
        return sendSuccess(res, { payment: already, receipt: already.receipt, duplicate: true }, 'This payment was already recorded');
      }
    }

    // Ownership check, scoped exactly like initiate — re-verified independently in case
    // a caller skips straight to verify with a different assignment id than they initiated.
    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: studentFeeAssignmentId, studentId: req.user.studentId },
    });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');
    // bring the late fee up to date BEFORE this payment, so lateness counts up to today
    const lateFee = await refreshLateFee(prisma, assignment.id);

    // split the confirmed amount under the Fee Policy (the rules were checked when the payment
    // started — this only decides where the money goes; extra money becomes credit when the
    // policy allows, otherwise it is refused as before)
    const full = await loadForPolicy(assignment.id);
    const policy = effectivePolicy(await getFeePolicy(prisma, req.institutionId), full.feeStructure);
    // AUTO_ADJUST: the previous academic year's dues are cleared first (worked out again now —
    // they may have changed since the payment started); the rest goes to this fee
    const pyRule = await previousDuesRule(prisma, { policy, assignment: full });
    const spread = spreadOverPreviousDues(pyRule, amountPaid);
    const onlyPrevious = spread.previous.length > 0 && !(spread.rest > 0.009);
    const split = onlyPrevious
      ? { fee: 0, late: 0, credit: 0 }
      : await planPayment(prisma, { policy, assignment: full, installments: full.installments, lateDue: lateFee.due, amount: spread.rest, channel: 'ONLINE', skipRules: true });
    const received = round2(split.fee + split.credit);

    const validSignature = paymentGateway.verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!validSignature) {
      throw new PaymentError('Payment verification failed — signature mismatch. This payment was not confirmed by the gateway.');
    }

    const receiptCount = await prisma.feeReceipt.count({
      where: { institutionId: req.institutionId },
    });
    const receiptNo = (i) => generateReceiptNumber('ONLINE', receiptCount + 1 + i);
    const receiptNumber = receiptNo(spread.previous.length);

    const result = await prisma.$transaction(async (tx) => {
      // previous-year dues first; the first payment recorded carries the Razorpay idempotency key
      const previousDuesPayments = await recordPreviousDuesPayments(tx, {
        institutionId: req.institutionId, studentId: req.user.studentId, previous: spread.previous, receiptNo,
        keyOf: (i) => (i === 0 ? `razorpay:${razorpayPaymentId}` : `razorpay:${razorpayPaymentId}:${i + 1}`),
        base: { paymentMode: 'RAZORPAY', transactionReference: razorpayPaymentId, remarks: `Online Payment via Razorpay (Order: ${razorpayOrderId})` },
      });
      if (onlyPrevious) {
        const first = await tx.feePayment.findUnique({ where: { id: previousDuesPayments[0].paymentId }, include: { receipt: true } });
        return { payment: first, receipt: first.receipt, split: { fee: 0, lateFee: 0, credit: 0 }, lateFeeReceipt: null, previousDuesPayments };
      }
      // the Razorpay payment is always recorded (it is the idempotency anchor), even when it
      // went entirely to the late fee
      const payment = await tx.feePayment.create({
        data: {
          institutionId: req.institutionId,
          studentId: req.user.studentId,
          studentFeeAssignmentId,
          amountPaid: received,
          creditAmount: split.credit,
          paymentMode: 'RAZORPAY',
          paymentStatus: 'SUCCESS',
          transactionReference: razorpayPaymentId,
          idempotencyKey: previousDuesPayments.length ? `razorpay:${razorpayPaymentId}:main` : `razorpay:${razorpayPaymentId}`, // one credit per Razorpay payment
          remarks: `Online Payment via Razorpay (Order: ${razorpayOrderId})${split.late > 0 ? ` — ₹${split.late} late fee` : ''}`,
        },
      });

      const receipt = await tx.feeReceipt.create({
        data: {
          receiptNumber,
          institutionId: req.institutionId,
          studentId: req.user.studentId,
          paymentId: payment.id,
          amount: received,
        },
      });

      // totals, per-head allocation and instalments (shared/fees/feePolicy.js)
      if (split.fee > 0) await applyToAssignment(tx, { assignmentId: studentFeeAssignmentId, paymentId: payment.id, amount: split.fee });
      if (split.credit > 0) {
        await addCredit(tx, { institutionId: req.institutionId, studentId: req.user.studentId, amount: split.credit, feePaymentId: payment.id, reason: 'Paid more than was due (online)' });
      }
      const lateFeeEntry = await recordLatePart(tx, {
        institutionId: req.institutionId, assignmentId: studentFeeAssignmentId, amount: split.late, paymentMode: 'OTHER', receiptNumber,
      });

      return { payment, receipt, split: { fee: split.fee, lateFee: split.late, credit: split.credit }, lateFeeReceipt: lateFeeEntry?.receiptNumber || null, previousDuesPayments };
    });
    if (split.credit > 0) await autoApplyCredit(prisma, { institutionId: req.institutionId, studentId: req.user.studentId });

    return sendSuccess(res, result, 'Payment verified and receipt generated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /fees/status — what the student needs before paying online: per fee, the amounts the
 * Fee Policy accepts (whole instalments only? a minimum? late fee included?), their fee
 * credit, and any holds (hall ticket, results, …) with the amount that releases them.
 */
const getFeeStatus = async (req, res, next) => {
  try {
    const studentId = req.user.studentId;
    const base = await getFeePolicy(prisma, req.institutionId);
    if (base.creditUse === 'AUTO') await autoApplyCredit(prisma, { institutionId: req.institutionId, studentId, policy: base });
    const fees = await prisma.studentFeeAssignment.findMany({
      where: { studentId, dueAmount: { gt: 0 } },
      include: { feeStructure: { select: { name: true, policyOverride: true } }, installments: true },
    });
    const rows = [];
    for (const a of fees) {
      const p = effectivePolicy(base, a.feeStructure);
      const lf = await refreshLateFee(prisma, a.id);
      const lateIncluded = p.lateFeeOrder !== 'SEPARATE';
      const wholeOnly = p.partialPayment === 'NOT_ALLOWED' || p.partialPayment === 'COUNTER_ONLY';
      const lateFirst = p.lateFeeOrder === 'FIRST' ? lf.due : 0;
      // previous academic year's dues for this fee (Fee Policy) — BLOCK: can't be paid yet;
      // AUTO_ADJUST: a payment clears them first (so the most it can take includes them)
      const py = await previousDuesRule(prisma, { policy: p, assignment: a });
      const pyInfo = py.mode === 'NONE' ? null : {
        mode: py.mode,
        total: py.dues.total,
        years: [...new Set(py.dues.fees.map((x) => x.yearName))],
        fees: py.dues.fees.map((x) => ({ assignmentId: x.id, feeName: x.name, yearName: x.yearName, dueAmount: x.dueAmount })),
        message: py.message,
      };
      rows.push({
        assignmentId: a.id,
        feeName: a.feeStructure.name,
        dueAmount: a.dueAmount,
        lateFeeDue: lf.due,
        lateFeeIncluded: lateIncluded,
        lateFeeOrder: p.lateFeeOrder,
        maxAmount: round2(a.dueAmount + (lateIncluded ? lf.due : 0) + (pyInfo?.mode === 'AUTO_ADJUST' ? pyInfo.total : 0)), // more than this only when extra money is kept as credit
        previousYearDues: pyInfo,
        payable: pyInfo?.mode !== 'BLOCK',
        extraAllowed: p.excessPayment === 'CREDIT',
        wholeInstalmentsOnly: wholeOnly,
        allowedAmounts: wholeOnly ? wholeInstalmentAmounts(a.dueAmount, a.installments).map((x) => round2(x + lateFirst)) : null,
        minimumAmount: minimumPayment(p, { feeDue: a.dueAmount, installments: a.installments, lateFirst }),
      });
    }
    const holds = await getFeeHolds(prisma, { institutionId: req.institutionId, studentId, policy: base });
    return sendSuccess(res, {
      onlinePaymentsEnabled: await isFeatureOn('online_payments'),
      fees: rows,
      credit: { balance: await creditBalance(prisma, studentId), autoUse: base.creditUse === 'AUTO' },
      holds: { blocked: holds.holds.map((h) => ({ type: h, label: HOLD_TYPES[h] })), amountToClear: holds.amountToClear },
    }, 'Fee status retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFeeBadge,
  getFeeStatus,
  getFeesOverview,
  initiateOnlinePayment,
  verifyOnlinePayment,
};
