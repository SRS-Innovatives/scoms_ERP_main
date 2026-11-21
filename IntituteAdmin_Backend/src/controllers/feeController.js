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
  BusinessRuleError,
  pushNotification,
  pushNotificationToMany, findList } = require('../../../shared');
const { recomputeItems } = require('../../../shared/fees/feeItems');
const { recomputeInstallments } = require('../../../shared/fees/installments');
const { refreshLateFee } = require('../../../shared/fees/lateFee');
const {
  getFeePolicy, effectivePolicy, planPayment, applyToAssignment, recordLatePart, addCredit, autoApplyCredit, round2,
} = require('../../../shared/fees/feePolicy');
const { previousDuesRule, spreadOverPreviousDues, recordPreviousDuesPayments } = require('../../../shared/fees/previousDues');

/** This legacy single-amount fee system is sunset for NEW billing as of this change —
 * two fee systems (this one and the Dynamic Fee Engine in feeEngineController.js) were
 * live side by side with no signal to staff about which to use, creating a real
 * duplicate-billing risk (two structures for the same real-world fee, both assignable to
 * the same student, both counted in the shared dashboards). Existing legacy structures/
 * assignments keep working — view, collect against, refund, report on — so money already
 * owed stays collectible. Only the three "create new billing" entry points are blocked. */
const LEGACY_SUNSET_MESSAGE = 'The classic Fee Structure system no longer accepts new fee structures or assignments — use the Dynamic Fee Engine (Fee Heads → Fee Structure Builder) instead. Existing legacy fee structures remain viewable and collectible.';
const blockLegacyCreate = () => { throw new BusinessRuleError(LEGACY_SUNSET_MESSAGE); };

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
    blockLegacyCreate();
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
    const { rows: assignments, meta: listMeta } = await findList(prisma.studentFeeAssignment, {
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
    }, req, { max: 10000 });
    return sendSuccess(res, assignments, 'Student fee assignments retrieved', 200, listMeta);
  } catch (err) {
    next(err);
  }
};

const assignFeeToStudent = async (req, res, next) => {
  try {
    blockLegacyCreate();
    // Institution-specific extra assignment fields (SuperAdmin-approved only — see
    // AdmissionCustomField, entityType FEE_ASSIGNMENT). Same trust convention as
    // admission/transport/hostel: frontend only ever renders APPROVED fields.
    const { feeStructureId, studentId, discountAmount, scholarshipName, scholarshipRef, customFields } = req.body;
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
        customFields: customFields && Object.keys(customFields).length > 0 ? customFields : undefined,
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
    blockLegacyCreate();
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

    // A CUSTOM plan for this one student (overrides the structure's schedule). It covers what
    // is left to pay right now, so the amount already paid is recorded as its base; payments
    // then fill the instalments in order (shared/fees/installments.js). All in one
    // transaction — the old plan is never lost if the new one fails.
    const created = await prisma.$transaction(async (tx) => {
      const old = await tx.feeInstallment.findMany({ where: { studentFeeAssignmentId }, select: { id: true } });
      if (old.length) {
        // past payments may point at the old instalments — keep the payments, drop the link
        await tx.feePayment.updateMany({ where: { installmentId: { in: old.map((o) => o.id) } }, data: { installmentId: null } });
        await tx.feeInstallment.deleteMany({ where: { studentFeeAssignmentId } });
      }
      await tx.feeInstallment.createMany({
        data: installments.map((inst, idx) => ({
          studentFeeAssignmentId,
          installmentNumber: idx + 1,
          amount: Number(inst.amount),
          dueDate: new Date(inst.dueDate),
        })),
      });
      await tx.studentFeeAssignment.update({
        where: { id: studentFeeAssignmentId },
        data: { installmentPlan: 'CUSTOM', installmentBase: assignment.paidAmount },
      });
      return recomputeInstallments(tx, studentFeeAssignmentId);
    });

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
    if (paymentMode === 'CREDIT') throw new ValidationError('Use "Pay from credit" to pay a fee from the student\'s credit');
    // bring the late fee up to date BEFORE this payment, so lateness counts up to today
    const lateFee = await refreshLateFee(prisma, assignment.id);

    if (installmentId) {
      const installment = await prisma.feeInstallment.findFirst({ where: { id: installmentId, studentFeeAssignmentId } });
      if (!installment) throw new NotFoundError('Installment not found or access denied');
    }

    // the institution's Fee Policy decides what this payment may be and where it goes:
    // late fee first/last, part payments, minimum, older fee first, extra money as credit
    const full = await prisma.studentFeeAssignment.findUnique({
      where: { id: assignment.id },
      include: { feeStructure: { select: { policyOverride: true } }, installments: true },
    });
    const policy = effectivePolicy(await getFeePolicy(prisma, req.institutionId), full.feeStructure);
    const overrideReason = req.body.overrideReason ? String(req.body.overrideReason).trim().slice(0, 300) : null;
    // previous academic year's dues (Fee Policy): BLOCK is enforced inside planPayment;
    // AUTO_ADJUST sends the money to them first (oldest year first) — shared/fees/previousDues.js
    const pyRule = await previousDuesRule(prisma, { policy, assignment: full });
    const spread = spreadOverPreviousDues(pyRule, amountPaid);
    const clearedIds = spread.previous.filter((p) => p.amount >= (pyRule.dues.fees.find((x) => x.id === p.id)?.dueAmount || 0) - 0.009).map((p) => p.id);
    let split = { fee: 0, late: 0, credit: 0 }; // everything went to previous dues
    if (!spread.previous.length || spread.rest > 0.009) {
      try {
        split = await planPayment(prisma, {
          policy, assignment: full, installments: full.installments, lateDue: lateFee.due,
          amount: spread.rest, channel: 'COUNTER', overrideReason, clearedIds,
        });
      } catch (e) {
        const previous = round2(spread.previous.reduce((t, p) => t + p.amount, 0));
        if (previous > 0 && e instanceof ValidationError && /exceeds/.test(e.message)) {
          throw new ValidationError(`Amount ₹${round2(amountPaid)} exceeds the outstanding due of ₹${round2(previous + full.dueAmount + (policy.lateFeeOrder === 'SEPARATE' ? 0 : lateFee.due))} (including ₹${previous} previous year dues)`);
        }
        throw e;
      }
    }
    const received = round2(split.fee + split.credit); // money recorded as the fee payment

    const inst = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });
    const receiptCount = await prisma.feeReceipt.count({ where: { institutionId: req.institutionId } });
    const receiptNo = (i) => generateReceiptNumber(inst ? inst.code : 'SCOMS', receiptCount + 1 + i);
    const receiptNumber = receiptNo(spread.previous.length);

    const result = await prisma.$transaction(async (tx) => {
      const previousDuesPayments = await recordPreviousDuesPayments(tx, {
        institutionId: req.institutionId, studentId, previous: spread.previous, receiptNo,
        base: { paymentMode: paymentMode || 'CASH', transactionReference, bankName, chequeNumber, receivedBy: req.user.email, remarks },
      });
      let payment = null;
      let receipt = null;
      if (received > 0) {
        payment = await tx.feePayment.create({
          data: {
            institutionId: req.institutionId,
            studentId,
            studentFeeAssignmentId,
            installmentId: installmentId || null,
            amountPaid: received,
            creditAmount: split.credit,
            paymentMode: paymentMode || 'CASH',
            paymentStatus: 'SUCCESS',
            transactionReference,
            bankName,
            chequeNumber,
            receivedBy: req.user.email,
            remarks,
          },
        });

        receipt = await tx.feeReceipt.create({
          data: {
            receiptNumber,
            institutionId: req.institutionId,
            studentId,
            paymentId: payment.id,
            amount: received,
          },
        });

        // totals, per-head allocation and instalments (shared/fees/feePolicy.js)
        if (split.fee > 0) await applyToAssignment(tx, { assignmentId: studentFeeAssignmentId, paymentId: payment.id, amount: split.fee });
        if (split.credit > 0) {
          await addCredit(tx, { institutionId: req.institutionId, studentId, amount: split.credit, feePaymentId: payment.id, reason: 'Paid more than was due', userId: req.user.id });
        }
      }
      const lateFeeEntry = await recordLatePart(tx, {
        institutionId: req.institutionId, assignmentId: studentFeeAssignmentId, amount: split.late,
        paymentMode: paymentMode || 'CASH', receiptNumber, userId: req.user.id,
      });

      return { payment, receipt, split: { fee: split.fee, lateFee: split.late, credit: split.credit }, lateFeeReceipt: lateFeeEntry?.receiptNumber || null, previousDuesPayments };
    });

    if (overrideReason) {
      prisma.auditLog.create({
        data: { institutionId: req.institutionId, userId: req.user.id, action: 'FEE_POLICY_OVERRIDDEN', module: 'FEES', entity: 'StudentFeeAssignment', entityId: studentFeeAssignmentId, newValues: JSON.stringify({ amount: Number(amountPaid), reason: overrideReason }) },
      }).catch(() => {});
    }
    if (split.credit > 0) await autoApplyCredit(prisma, { institutionId: req.institutionId, studentId });

    const adjusted = round2(spread.previous.reduce((t, p) => t + p.amount, 0));
    const extra = [adjusted > 0 && `₹${adjusted} adjusted to previous year dues`, split.late > 0 && `₹${split.late} to the late fee`, split.credit > 0 && `₹${split.credit} kept as credit`].filter(Boolean).join(', ');
    return sendSuccess(res, result, `Fee payment collected and receipt generated${extra ? ` (${extra})` : ''}`, 201);
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
    const { rows: challans, meta: listMeta } = await findList(prisma.feeChallan, {
      where: { institutionId: req.institutionId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
      orderBy: { createdAt: 'desc' },
    }, req);
    return sendSuccess(res, challans, 'Challans retrieved', 200, listMeta);
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
    const { rows: scholarships, meta: listMeta } = await findList(prisma.studentFeeAssignment, {
      where: { feeStructure: { institutionId: req.institutionId }, discountAmount: { gt: 0 } },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        feeStructure: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }, req, { max: 10000 });
    return sendSuccess(res, scholarships, 'Scholarships retrieved', 200, listMeta);
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

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.studentFeeAssignment.update({
        where: { id },
        data: { discountAmount: newDiscount, dueAmount: newDueAmount, status: newStatus, scholarshipName, scholarshipRef },
      });
      // reflect the discount on the per-head breakdown too (no-op for legacy fees without heads)
      await recomputeItems(tx, id);
      return row;
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
    const { rows: refunds, meta: listMeta } = await findList(prisma.feeRefund, {
      where: { institutionId: req.institutionId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
      orderBy: { createdAt: 'desc' },
    }, req);
    return sendSuccess(res, refunds, 'Refunds retrieved', 200, listMeta);
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
    const { rows: pending, meta: listMeta } = await findList(prisma.studentFeeAssignment, {
      where: { feeStructure: { institutionId: req.institutionId }, status: { in: ['PENDING', 'PARTIAL'] } },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, course: { select: { name: true } } } },
        feeStructure: { select: { name: true, dueDate: true } },
      },
      orderBy: { feeStructure: { dueDate: 'asc' } },
    }, req, { max: 10000 });
    return sendSuccess(res, pending, 'Pending fees retrieved', 200, listMeta);
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
        where: { institutionId: req.institutionId, paymentStatus: 'SUCCESS', paymentMode: { not: 'CREDIT' }, paidAt: { gte: startOfToday } },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.feePayment.aggregate({
        where: { institutionId: req.institutionId, paymentStatus: 'SUCCESS', paymentMode: { not: 'CREDIT' }, paidAt: { gte: startOfMonth } },
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
      where: { institutionId: req.institutionId, paymentStatus: 'SUCCESS', paymentMode: { not: 'CREDIT' }, paidAt: { gte: fromDate, lte: toDate } },
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
      where: { institutionId: req.institutionId, paymentMode: { not: 'CREDIT' }, paidAt: { gte: start, lte: end } },
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
