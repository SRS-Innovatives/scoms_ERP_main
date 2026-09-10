/**
 * Institute Admin Fee & Receipts Management Controller
 *
 * FeeStructure (per course/category) -> StudentFeeAssignment (per student, optionally
 * split into FeeInstallment rows) -> FeePayment (each collection) -> FeeReceipt (1:1
 * with a payment). FeeChallan is a standalone printable bank-challan record. FeeRefund
 * tracks money returned to a student (caution deposit, excess payment, cancellation).
 *
 * Every lookup by a client-supplied id is scoped to req.institutionId (directly, or via
 * a relation) — never trust a raw studentFeeAssignmentId/installmentId/paymentId alone.
 */
const {
  prisma,
  sendSuccess,
  generateReceiptNumber,
  generateChallanNumber,
  NotFoundError,
  ValidationError,
  pushNotification,
  pushNotificationToMany,
} = require('../../../shared');

// ============================================================
// Fee Categories (static — backed by the FeeCategoryType enum)
// ============================================================
const FEE_CATEGORY_LABELS = {
  TUITION_FEE: 'Tuition Fee',
  EXAM_FEE: 'Examination Fee',
  LIBRARY_FEE: 'Library Fee',
  TRANSPORT_FEE: 'Transport Fee',
  HOSTEL_FEE: 'Hostel Fee',
  LAB_FEE: 'Laboratory Fee',
  ADMISSION_FEE: 'Admission Fee',
  DEVELOPMENT_FEE: 'Development Fee',
  OTHER_FEE: 'Other Fee',
};

const getFeeCategories = async (req, res, next) => {
  try {
    const structures = await prisma.feeStructure.groupBy({
      by: ['category'],
      where: { institutionId: req.institutionId },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    const byCategory = Object.fromEntries(structures.map((s) => [s.category, s]));
    const categories = Object.entries(FEE_CATEGORY_LABELS).map(([code, name]) => ({
      code,
      name,
      structureCount: byCategory[code]?._count?._all || 0,
      totalConfigured: byCategory[code]?._sum?.totalAmount || 0,
    }));
    return sendSuccess(res, categories, 'Fee categories retrieved');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Fee Structures
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

const createFeeStructure = async (req, res, next) => {
  try {
    const { name, category, academicYearId, courseId, totalAmount, dueDate, lateFeePerDay } = req.body;
    if (!name || !academicYearId || !totalAmount || !dueDate) {
      throw new ValidationError('name, academicYearId, totalAmount, dueDate are required');
    }

    const year = await prisma.academicYear.findFirst({ where: { id: academicYearId, institutionId: req.institutionId } });
    if (!year) throw new NotFoundError('Academic year not found or access denied');

    if (courseId) {
      const course = await prisma.course.findFirst({ where: { id: courseId, institutionId: req.institutionId } });
      if (!course) throw new NotFoundError('Course not found or access denied');
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        institutionId: req.institutionId,
        academicYearId,
        courseId: courseId || null,
        name,
        category: category || 'TUITION_FEE',
        totalAmount: Number(totalAmount),
        dueDate: new Date(dueDate),
        lateFeePerDay: Number(lateFeePerDay) || 0,
      },
    });
    return sendSuccess(res, feeStructure, 'Fee structure created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.feeStructure.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Fee structure not found');
    await prisma.feeStructure.delete({ where: { id } });
    return sendSuccess(res, null, 'Fee structure deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Student Fee Assignment (individual + bulk)
// ============================================================
const computeAssignment = (structure, discountAmount = 0) => ({
  totalAmount: structure.totalAmount,
  discountAmount: Number(discountAmount) || 0,
  paidAmount: 0,
  dueAmount: structure.totalAmount - (Number(discountAmount) || 0),
});

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

const assignFeeToStudent = async (req, res, next) => {
  try {
    const { feeStructureId, studentId, discountAmount, scholarshipName, scholarshipRef } = req.body;
    if (!feeStructureId || !studentId) throw new ValidationError('feeStructureId and studentId are required');

    const structure = await prisma.feeStructure.findFirst({ where: { id: feeStructureId, institutionId: req.institutionId } });
    if (!structure) throw new NotFoundError('Fee structure not found or access denied');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const existing = await prisma.studentFeeAssignment.findUnique({
      where: { feeStructureId_studentId: { feeStructureId, studentId } },
    });
    if (existing) throw new ValidationError('This fee structure is already assigned to this student');

    const assignment = await prisma.studentFeeAssignment.create({
      data: {
        feeStructureId,
        studentId,
        ...computeAssignment(structure, discountAmount),
        scholarshipName: scholarshipName || null,
        scholarshipRef: scholarshipRef || null,
      },
    });

    pushNotification({
      userId: student.userId,
      institutionId: req.institutionId,
      title: 'New Fee Due',
      message: `${structure.name}: ₹${assignment.dueAmount} due by ${structure.dueDate ? new Date(structure.dueDate).toLocaleDateString('en-IN') : 'the scheduled date'}.`,
      type: 'FEE',
      link: '/student/fees',
    }).catch(() => {});

    return sendSuccess(res, assignment, 'Fee assigned to student successfully', 201);
  } catch (err) {
    next(err);
  }
};

const bulkAssignFee = async (req, res, next) => {
  try {
    const { feeStructureId, courseId, sectionId } = req.body;
    if (!feeStructureId || !courseId) throw new ValidationError('feeStructureId and courseId are required');

    const structure = await prisma.feeStructure.findFirst({ where: { id: feeStructureId, institutionId: req.institutionId } });
    if (!structure) throw new NotFoundError('Fee structure not found or access denied');

    const students = await prisma.student.findMany({
      where: { institutionId: req.institutionId, courseId, status: 'ACTIVE', ...(sectionId && { sectionId }) },
      select: { id: true, userId: true },
    });
    if (students.length === 0) throw new ValidationError('No active students found for the selected course/section');

    const already = await prisma.studentFeeAssignment.findMany({
      where: { feeStructureId, studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true },
    });
    const alreadySet = new Set(already.map((a) => a.studentId));
    const toAssign = students.filter((s) => !alreadySet.has(s.id));

    if (toAssign.length > 0) {
      await prisma.studentFeeAssignment.createMany({
        data: toAssign.map((s) => ({
          feeStructureId,
          studentId: s.id,
          ...computeAssignment(structure),
        })),
      });

      pushNotificationToMany({
        userIds: toAssign.map((s) => s.userId),
        institutionId: req.institutionId,
        title: 'New Fee Due',
        message: `${structure.name}: ₹${structure.totalAmount} due by ${structure.dueDate ? new Date(structure.dueDate).toLocaleDateString('en-IN') : 'the scheduled date'}.`,
        type: 'FEE',
        link: '/student/fees',
      }).catch(() => {});
    }

    return sendSuccess(
      res,
      { assigned: toAssign.length, alreadyAssigned: alreadySet.size, totalStudents: students.length },
      `Fee structure assigned to ${toAssign.length} student(s)${alreadySet.size ? ` (${alreadySet.size} already had it)` : ''}`,
      201
    );
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Installments
// ============================================================
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

const createInstallmentPlan = async (req, res, next) => {
  try {
    const { studentFeeAssignmentId, installments } = req.body; // [{ amount, dueDate }]
    if (!studentFeeAssignmentId || !Array.isArray(installments) || installments.length === 0) {
      throw new ValidationError('studentFeeAssignmentId and a non-empty installments array are required');
    }

    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: studentFeeAssignmentId, feeStructure: { institutionId: req.institutionId } },
    });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');

    const planTotal = installments.reduce((sum, i) => sum + Number(i.amount), 0);
    if (Math.abs(planTotal - assignment.dueAmount) > 1) {
      throw new ValidationError(`Installment amounts (₹${planTotal}) must add up to the outstanding due amount (₹${assignment.dueAmount})`);
    }

    await prisma.feeInstallment.deleteMany({ where: { studentFeeAssignmentId } });
    const created = await prisma.$transaction(
      installments.map((inst, idx) =>
        prisma.feeInstallment.create({
          data: {
            studentFeeAssignmentId,
            installmentNumber: idx + 1,
            amount: Number(inst.amount),
            dueDate: new Date(inst.dueDate),
          },
        })
      )
    );

    return sendSuccess(res, created, 'Installment plan created successfully', 201);
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

    // Tenant-scope the assignment (and via it, the student) — never trust the raw id.
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
    const { id } = req.params; // receipt id OR receiptNumber
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
// Scholarships (StudentFeeAssignment.discountAmount + scheme metadata)
// ============================================================
const getScholarships = async (req, res, next) => {
  try {
    const scholarships = await prisma.studentFeeAssignment.findMany({
      where: { feeStructure: { institutionId: req.institutionId }, discountAmount: { gt: 0 } },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, scholarships, 'Scholarships retrieved');
  } catch (err) {
    next(err);
  }
};

const applyScholarship = async (req, res, next) => {
  try {
    const { id } = req.params; // studentFeeAssignment id
    const { discountAmount, scholarshipName, scholarshipRef } = req.body;
    if (discountAmount === undefined) throw new ValidationError('discountAmount is required');

    const assignment = await prisma.studentFeeAssignment.findFirst({ where: { id, feeStructure: { institutionId: req.institutionId } } });
    if (!assignment) throw new NotFoundError('Fee assignment not found or access denied');

    const newDiscount = Number(discountAmount);
    const newDueAmount = Math.max(0, assignment.totalAmount - newDiscount - assignment.paidAmount);
    const newStatus = newDueAmount <= 0 ? 'PAID' : assignment.paidAmount > 0 ? 'PARTIAL' : 'PENDING';

    const updated = await prisma.studentFeeAssignment.update({
      where: { id },
      data: { discountAmount: newDiscount, dueAmount: newDueAmount, status: newStatus, scholarshipName, scholarshipRef },
    });
    return sendSuccess(res, updated, 'Scholarship applied successfully');
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
    const { status } = req.body; // PROCESSED or REJECTED
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
// Dashboard, Reports, Cash Book / Day Book, Pending Fees
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

const getFeeReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const payments = await prisma.feePayment.findMany({
      where: { institutionId: req.institutionId, paymentStatus: 'SUCCESS', paidAt: { gte: fromDate, lte: toDate } },
      include: { studentFeeAssignment: { include: { feeStructure: { select: { category: true } } } } },
    });

    const byCategory = {};
    const byMode = {};
    payments.forEach((p) => {
      const cat = p.studentFeeAssignment?.feeStructure?.category || 'OTHER_FEE';
      byCategory[cat] = (byCategory[cat] || 0) + p.amountPaid;
      byMode[p.paymentMode] = (byMode[p.paymentMode] || 0) + p.amountPaid;
    });

    return sendSuccess(res, {
      from: fromDate,
      to: toDate,
      totalCollected: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      totalTransactions: payments.length,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
      byMode: Object.entries(byMode).map(([mode, amount]) => ({ mode, amount })),
    }, 'Fee report generated');
  } catch (err) {
    next(err);
  }
};

/** Cash book / day book — every payment on a given date, split by cash vs bank/digital modes. */
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
  getFeeCategories,
  getFeeStructures,
  createFeeStructure,
  deleteFeeStructure,
  getStudentAssignments,
  assignFeeToStudent,
  bulkAssignFee,
  getInstallments,
  createInstallmentPlan,
  collectOfflineFee,
  getReceipt,
  getChallans,
  createChallan,
  getScholarships,
  applyScholarship,
  getRefunds,
  createRefund,
  processRefund,
  getPendingFees,
  getFeeDashboard,
  getFeeReports,
  getDayBook,
};
