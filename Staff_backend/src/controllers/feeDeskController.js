/**
 * Staff Portal — Fee Collection Desk Controller (Accountant role)
 *
 * Trimmed port of IntituteAdmin_Backend's feeController — only the view/collect/refund
 * surface an Accountant needs (FEES_VIEW, FEES_COLLECT, FEES_REFUND). Fee structure
 * design (create/delete FeeStructure, bulk-assign, scholarships) stays an Institute
 * Admin responsibility and is intentionally left out here.
 */
const {
  prisma,
  sendSuccess,
  generateReceiptNumber,
  generateChallanNumber,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

// ============================================================
// Fee Structures & Assignments (read-only for the desk)
// ============================================================
const getFeeStructures = async (req, res, next) => {
  try {
    const feeStructures = await prisma.feeStructure.findMany({
      where: { institutionId: req.institutionId },
      include: {
        academicYear: { select: { yearName: true } },
        course: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, feeStructures, 'Fee structures retrieved');
  } catch (err) {
    next(err);
  }
};

const getStudentAssignments = async (req, res, next) => {
  try {
    const { feeStructureId, status, studentId } = req.query;
    const assignments = await prisma.studentFeeAssignment.findMany({
      where: {
        feeStructure: { institutionId: req.institutionId },
        ...(feeStructureId && { feeStructureId }),
        ...(status && { status }),
        ...(studentId && { studentId }),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, course: { select: { name: true } } } },
        feeStructure: { select: { name: true, category: true, dueDate: true } },
        _count: { select: { installments: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, assignments, 'Student fee assignments retrieved');
  } catch (err) {
    next(err);
  }
};

const getInstallments = async (req, res, next) => {
  try {
    const installments = await prisma.feeInstallment.findMany({
      where: { studentFeeAssignment: { feeStructure: { institutionId: req.institutionId } } },
      include: {
        studentFeeAssignment: {
          select: {
            student: { select: { firstName: true, lastName: true, rollNumber: true } },
            feeStructure: { select: { name: true } },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });
    return sendSuccess(res, installments, 'Installments retrieved');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Payment Collection
// ============================================================
const collectOfflineFee = async (req, res, next) => {
  try {
    const {
      studentId,
      studentFeeAssignmentId,
      installmentId,
      amountPaid,
      paymentMode,
      transactionReference,
      bankName,
      chequeNumber,
      remarks,
    } = req.body;

    if (!studentId || !studentFeeAssignmentId || !amountPaid) {
      throw new ValidationError('studentId, studentFeeAssignmentId, amountPaid are required');
    }

    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: studentFeeAssignmentId, studentId, feeStructure: { institutionId: req.institutionId } },
    });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');

    let installment = null;
    if (installmentId) {
      installment = await prisma.feeInstallment.findFirst({ where: { id: installmentId, studentFeeAssignmentId } });
      if (!installment) throw new NotFoundError('Installment not found or access denied');
    }

    const inst = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });
    const receiptCount = await prisma.feeReceipt.count({ where: { institutionId: req.institutionId } });
    const receiptNumber = generateReceiptNumber(inst ? inst.code : 'SCOMS', receiptCount + 1);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          institutionId: req.institutionId,
          studentId,
          studentFeeAssignmentId,
          installmentId: installmentId || null,
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

      const newPaidAmount = assignment.paidAmount + Number(amountPaid);
      const newDueAmount = Math.max(0, assignment.totalAmount - assignment.discountAmount - newPaidAmount);
      const newStatus = newDueAmount <= 0 ? 'PAID' : 'PARTIAL';

      await tx.studentFeeAssignment.update({
        where: { id: studentFeeAssignmentId },
        data: { paidAmount: newPaidAmount, dueAmount: newDueAmount, status: newStatus },
      });

      if (installment) {
        const instPaid = installment.paidAmount + Number(amountPaid);
        await tx.feeInstallment.update({
          where: { id: installment.id },
          data: { paidAmount: instPaid, status: instPaid >= installment.amount ? 'PAID' : 'PARTIAL' },
        });
      }

      return { payment, receipt };
    });

    return sendSuccess(res, result, 'Fee payment collected and receipt generated', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Receipts & Challans
// ============================================================
const getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const receipt = await prisma.feeReceipt.findFirst({
      where: { institutionId: req.institutionId, OR: [{ id }, { receiptNumber: id }] },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, admissionNumber: true, course: { select: { name: true } } } },
        payment: true,
      },
    });
    if (!receipt) throw new NotFoundError('Receipt not found');
    return sendSuccess(res, receipt, 'Receipt retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getChallans = async (req, res, next) => {
  try {
    const challans = await prisma.feeChallan.findMany({
      where: { institutionId: req.institutionId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, challans, 'Challans retrieved');
  } catch (err) {
    next(err);
  }
};

const createChallan = async (req, res, next) => {
  try {
    const { studentId, amount, dueDate, bankName } = req.body;
    if (!studentId || !amount || !dueDate) throw new ValidationError('studentId, amount, dueDate are required');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const inst = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });
    const challanCount = await prisma.feeChallan.count({ where: { institutionId: req.institutionId } });
    const challanNumber = generateChallanNumber(inst ? inst.code : 'SCOMS', challanCount + 1);

    const challan = await prisma.feeChallan.create({
      data: {
        challanNumber,
        institutionId: req.institutionId,
        studentId,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        bankName: bankName || 'State Bank of India',
      },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
    });
    return sendSuccess(res, challan, 'Bank challan generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Refunds
// ============================================================
const getRefunds = async (req, res, next) => {
  try {
    const refunds = await prisma.feeRefund.findMany({
      where: { institutionId: req.institutionId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, refunds, 'Refunds retrieved');
  } catch (err) {
    next(err);
  }
};

const createRefund = async (req, res, next) => {
  try {
    const { studentId, reason, amount, bankAccount } = req.body;
    if (!studentId || !reason || !amount) throw new ValidationError('studentId, reason, amount are required');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const refund = await prisma.feeRefund.create({
      data: { institutionId: req.institutionId, studentId, reason, amount: Number(amount), bankAccount },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
    });
    return sendSuccess(res, refund, 'Refund request recorded', 201);
  } catch (err) {
    next(err);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const refund = await prisma.feeRefund.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!refund) throw new NotFoundError('Refund not found');

    const updated = await prisma.feeRefund.update({
      where: { id },
      data: { status, processedAt: status === 'PROCESSED' ? new Date() : null },
    });
    return sendSuccess(res, updated, `Refund marked as ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Dashboard & Day Book
// ============================================================
const getPendingFees = async (req, res, next) => {
  try {
    const pending = await prisma.studentFeeAssignment.findMany({
      where: { feeStructure: { institutionId: req.institutionId }, status: { in: ['PENDING', 'PARTIAL'] } },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, course: { select: { name: true } } } },
        feeStructure: { select: { name: true, dueDate: true } },
      },
      orderBy: { feeStructure: { dueDate: 'asc' } },
    });
    return sendSuccess(res, pending, 'Pending fees retrieved');
  } catch (err) {
    next(err);
  }
};

const getFeeDashboard = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const [todayAgg, monthAgg, allAssignments, defaulterCount] = await Promise.all([
      prisma.feePayment.aggregate({
        where: { institutionId: req.institutionId, paymentStatus: 'SUCCESS', paidAt: { gte: startOfToday } },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.feePayment.aggregate({
        where: { institutionId: req.institutionId, paymentStatus: 'SUCCESS', paidAt: { gte: startOfMonth } },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.studentFeeAssignment.aggregate({
        where: { feeStructure: { institutionId: req.institutionId } },
        _sum: { totalAmount: true, discountAmount: true, paidAmount: true, dueAmount: true },
      }),
      prisma.studentFeeAssignment.count({
        where: { feeStructure: { institutionId: req.institutionId } },
      }),
    ]);

    return sendSuccess(res, {
      collectedToday: todayAgg._sum.amountPaid || 0,
      paymentsToday: todayAgg._count._all,
      collectedThisMonth: monthAgg._sum.amountPaid || 0,
      paymentsThisMonth: monthAgg._count._all,
      totalPrescribed: allAssignments._sum.totalAmount || 0,
      totalDiscount: allAssignments._sum.discountAmount || 0,
      totalCollected: allAssignments._sum.paidAmount || 0,
      totalOutstanding: allAssignments._sum.dueAmount || 0,
      totalAssignments: defaulterCount,
    }, 'Fee dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
};

const getDayBook = async (req, res, next) => {
  try {
    const { date } = req.query;
    const day = date ? new Date(date) : new Date();
    const start = new Date(day.setHours(0, 0, 0, 0));
    const end = new Date(day.setHours(23, 59, 59, 999));

    const payments = await prisma.feePayment.findMany({
      where: { institutionId: req.institutionId, paidAt: { gte: start, lte: end } },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } }, receipt: { select: { receiptNumber: true } } },
      orderBy: { paidAt: 'asc' },
    });

    const cashTotal = payments.filter((p) => p.paymentMode === 'CASH').reduce((sum, p) => sum + p.amountPaid, 0);
    const bankTotal = payments.filter((p) => p.paymentMode !== 'CASH').reduce((sum, p) => sum + p.amountPaid, 0);

    return sendSuccess(res, { date: start, payments, cashTotal, bankTotal, grandTotal: cashTotal + bankTotal }, 'Day book retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFeeStructures,
  getStudentAssignments,
  getInstallments,
  collectOfflineFee,
  getReceipt,
  getChallans,
  createChallan,
  getRefunds,
  createRefund,
  processRefund,
  getPendingFees,
  getFeeDashboard,
  getDayBook,
};
