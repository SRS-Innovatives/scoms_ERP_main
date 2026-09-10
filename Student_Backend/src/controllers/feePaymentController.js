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

const getFeesOverview = async (req, res, next) => {
  try {
    const feeAssignments = await prisma.studentFeeAssignment.findMany({
      where: { studentId: req.user.studentId },
      include: {
        feeStructure: true,
        payments: { include: { receipt: true } },
      },
    });

    return sendSuccess(res, feeAssignments, 'Fee ledger retrieved');
  } catch (err) {
    next(err);
  }
};

const initiateOnlinePayment = async (req, res, next) => {
  try {
    const { studentFeeAssignmentId, amount } = req.body;
    if (!studentFeeAssignmentId || !amount) throw new ValidationError('studentFeeAssignmentId and amount are required');

    // Ownership check — the assignment must belong to the caller, not just exist.
    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: studentFeeAssignmentId, studentId: req.user.studentId },
    });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');

    if (Number(amount) > assignment.dueAmount) {
      throw new ValidationError(`Amount exceeds the outstanding due amount of ₹${assignment.dueAmount}`);
    }

    const order = await paymentGateway.createOrder(Number(amount));
    return sendSuccess(res, order, 'Payment order created successfully');
  } catch (err) {
    next(err);
  }
};

const verifyOnlinePayment = async (req, res, next) => {
  try {
    const {
      studentFeeAssignmentId,
      amountPaid,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!studentFeeAssignmentId || !amountPaid) throw new ValidationError('studentFeeAssignmentId and amountPaid are required');

    // Ownership check, scoped exactly like initiate — re-verified independently in case
    // a caller skips straight to verify with a different assignment id than they initiated.
    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: studentFeeAssignmentId, studentId: req.user.studentId },
    });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');

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
    const receiptNumber = generateReceiptNumber('ONLINE', receiptCount + 1);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          institutionId: req.institutionId,
          studentId: req.user.studentId,
          studentFeeAssignmentId,
          amountPaid: Number(amountPaid),
          paymentMode: 'RAZORPAY',
          paymentStatus: 'SUCCESS',
          transactionReference: razorpayPaymentId,
          remarks: `Online Payment via Razorpay (Order: ${razorpayOrderId})`,
        },
      });

      const receipt = await tx.feeReceipt.create({
        data: {
          receiptNumber,
          institutionId: req.institutionId,
          studentId: req.user.studentId,
          paymentId: payment.id,
          amount: Number(amountPaid),
        },
      });

      const newPaidAmount = assignment.paidAmount + Number(amountPaid);
      const newDueAmount = Math.max(0, assignment.totalAmount - assignment.discountAmount - newPaidAmount);
      const newStatus = newDueAmount <= 0 ? 'PAID' : 'PARTIAL';

      await tx.studentFeeAssignment.update({
        where: { id: studentFeeAssignmentId },
        data: { paidAmount: newPaidAmount, dueAmount: newDueAmount, status: newStatus },
      });

      return { payment, receipt };
    });

    return sendSuccess(res, result, 'Payment verified and receipt generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFeesOverview,
  initiateOnlinePayment,
  verifyOnlinePayment,
};
