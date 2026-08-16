/**
 * Institute Admin Fee & Receipts Management Controller
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
  generateReceiptNumber,
  generateChallanNumber,
} = require('../../../shared');

const getFeeStructures = async (req, res, next) => {
  try {
    const feeStructures = await prisma.feeStructure.findMany({
      where: { institutionId: req.institutionId },
      include: {
        academicYear: true,
        course: true,
        _count: { select: { assignments: true } },
      },
    });
    return sendSuccess(res, feeStructures, 'Fee structures retrieved');
  } catch (err) {
    next(err);
  }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const { name, academicYearId, courseId, totalAmount, dueDate } = req.body;
    const feeStructure = await prisma.feeStructure.create({
      data: {
        institutionId: req.institutionId,
        academicYearId,
        courseId,
        name,
        totalAmount: Number(totalAmount),
        dueDate: new Date(dueDate),
      },
    });
    return sendSuccess(res, feeStructure, 'Fee structure created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const collectOfflineFee = async (req, res, next) => {
  try {
    const {
      studentId,
      studentFeeAssignmentId,
      amountPaid,
      paymentMode,
      transactionReference,
      bankName,
      chequeNumber,
      remarks,
    } = req.body;

    const receiptCount = await prisma.feeReceipt.count({
      where: { institutionId: req.institutionId },
    });

    const inst = await prisma.institution.findUnique({
      where: { id: req.institutionId },
      select: { code: true },
    });

    const receiptNumber = generateReceiptNumber(inst ? inst.code : 'SCOMS', receiptCount + 1);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          institutionId: req.institutionId,
          studentId,
          studentFeeAssignmentId,
          amountPaid: Number(amountPaid),
          paymentMode: paymentMode || 'CASH',
          paymentStatus: 'SUCCESS',
          transactionReference,
          bankName,
          chequeNumber,
          receivedBy: req.user.email,
          remarks,
        },
      });

      const receipt = await tx.feeReceipt.create({
        data: {
          receiptNumber,
          institutionId: req.institutionId,
          studentId,
          paymentId: payment.id,
          amount: Number(amountPaid),
        },
      });

      // Update fee assignment paidAmount
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

    return sendSuccess(res, result, 'Fee payment collected and receipt generated', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  collectOfflineFee,
};
