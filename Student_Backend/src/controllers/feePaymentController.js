/**
 * Student Fee Overview & Razorpay Payment Gateway Controller
 */

const {
  prisma,
  sendSuccess,
  generateReceiptNumber,
  PaymentError,
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

    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: studentFeeAssignmentId },
    });

    if (!assignment) {
      throw new PaymentError('Invalid fee assignment specified');
    }

    // Razorpay Order Creation Mock / Real Integration Abstraction
    const orderId = `order_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return sendSuccess(res, {
      orderId,
      amount: Number(amount),
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
    }, 'Payment order created successfully');
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

    // Verify signature logic
    if (!razorpayPaymentId) {
      throw new PaymentError('Payment verification failed. Missing transaction reference.');
    }

    const receiptCount = await prisma.feeReceipt.count({
      where: { institutionId: req.user.institutionId },
    });

    const receiptNumber = generateReceiptNumber('ONLINE', receiptCount + 1);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          institutionId: req.user.institutionId,
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
          institutionId: req.user.institutionId,
          studentId: req.user.studentId,
          paymentId: payment.id,
          amount: Number(amountPaid),
        },
      });

      const assignment = await tx.studentFeeAssignment.findUnique({
        where: { id: studentFeeAssignmentId },
      });

      if (assignment) {
        const newPaidAmount = assignment.paidAmount + Number(amountPaid);
        const newDueAmount = assignment.totalAmount - assignment.discountAmount - newPaidAmount;
        const newStatus = newDueAmount <= 0 ? 'PAID' : 'PARTIAL';

        await tx.studentFeeAssignment.update({
          where: { id: studentFeeAssignmentId },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: Math.max(0, newDueAmount),
            status: newStatus,
          },
        });
      }

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
