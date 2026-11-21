/**
 * Institute Admin — Dynamic Fee Engine Controller
 *
 * Metadata-driven fee management, additive alongside the existing feeController.js (which
 * keeps working unchanged for any current caller). The core distinction this file adds:
 *
 *   FeeHead / FeeCategory   — Layer 1: what fee heads exist (institution-defined, unlimited)
 *   FeeStructure + Items    — Layer 2: a named bundle of fee heads with amounts, draft/publish/version
 *   StudentFeeAssignment
 *     + StudentFeeItem      — Layer 3: the per-student, per-head snapshot once a structure is assigned
 *   FeePayment
 *     + PaymentAllocation   — one payment can be split across multiple fee-head items
 *
 * Every id a client submits is re-verified against req.institutionId before use — never
 * trusted directly. All money math happens here, never assumed correct from the frontend.
 */
const { enforcePreviousDues } = require('../../../shared/fees/previousDues');
const {
  prisma,
  sendSuccess,
  generateReceiptNumber,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} = require('../../../shared');
const { Prisma } = require('@prisma/client');
const { parseRule } = require('../../../shared/fees/feeRules');
const { assignResolvedStructure } = require('../../../shared/fees/feeSync');
const { versionChainIds, itemsInHeadOrder } = require('../../../shared/fees/feeItems');
const {
  getFeePolicy, effectivePolicy, checkPartialRules, checkHeadOrder, olderUnpaidFee, recordLatePart, parseOverride, autoApplyCredit, round2,
} = require('../../../shared/fees/feePolicy');
const { parseSchedule, createInstallmentsFromSchedule, recomputeInstallments } = require('../../../shared/fees/installments');
const { attachInstallments } = require('../../../shared/fees/feeView');
const { refreshLateFee } = require('../../../shared/fees/lateFee');

// ============================================================
// Fee Categories (Layer 1 — institution-defined, unlimited)
// ============================================================

const getFeeCategoriesV2 = async (req, res, next) => {
  try {
    const categories = await prisma.feeCategory.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { feeHeads: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return sendSuccess(res, categories, 'Fee categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createFeeCategory = async (req, res, next) => {
  try {
    const { name, code, description, sortOrder } = req.body;
    if (!name || !code) throw new ValidationError('name and code are required');

    const category = await prisma.feeCategory.create({
      data: { institutionId: req.institutionId, name, code: code.toUpperCase(), description, sortOrder: sortOrder || 0 },
    });
    return sendSuccess(res, category, 'Fee category created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Fee Heads (Layer 1 — institution-defined, unlimited)
// ============================================================

const getFeeHeads = async (req, res, next) => {
  try {
    const { active } = req.query;
    const heads = await prisma.feeHead.findMany({
      where: { institutionId: req.institutionId, ...(active !== undefined && { active: active === 'true' }) },
      include: { category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, heads, 'Fee heads retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createFeeHead = async (req, res, next) => {
  try {
    const { name, code, categoryId, description, mandatory, taxApplicable, lateFeeApplicable } = req.body;
    if (!name || !code) throw new ValidationError('name and code are required');

    if (categoryId) {
      const category = await prisma.feeCategory.findFirst({ where: { id: categoryId, institutionId: req.institutionId } });
      if (!category) throw new NotFoundError('Fee category not found or access denied');
    }

    const head = await prisma.feeHead.create({
      data: {
        institutionId: req.institutionId,
        categoryId: categoryId || null,
        name,
        code: code.toUpperCase(),
        description,
        mandatory: mandatory ?? true,
        taxApplicable: taxApplicable ?? false,
        lateFeeApplicable: lateFeeApplicable ?? false,
        createdById: req.user.id,
      },
    });
    return sendSuccess(res, head, 'Fee head created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateFeeHead = async (req, res, next) => {
  try {
    const existing = await prisma.feeHead.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Fee head not found or access denied');

    const { name, categoryId, description, mandatory, active, taxApplicable, lateFeeApplicable } = req.body;
    const updated = await prisma.feeHead.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(description !== undefined && { description }),
        ...(mandatory !== undefined && { mandatory }),
        ...(active !== undefined && { active }),
        ...(taxApplicable !== undefined && { taxApplicable }),
        ...(lateFeeApplicable !== undefined && { lateFeeApplicable }),
      },
    });
    return sendSuccess(res, updated, 'Fee head updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Soft-delete — a fee head already referenced by a structure/payment history can never be
 * hard-deleted without corrupting historical records, so this always just deactivates it. */
const deactivateFeeHead = async (req, res, next) => {
  try {
    const existing = await prisma.feeHead.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Fee head not found or access denied');

    const updated = await prisma.feeHead.update({ where: { id: existing.id }, data: { active: false } });
    return sendSuccess(res, updated, 'Fee head deactivated successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Fee Structure Builder (Layer 2 — draft/publish/version)
// ============================================================

/** Late fee settings from the builder: grace days (whole days, 0-365) and the maximum (₹, empty = no limit). */
const lateFeeGrace = (v) => {
  const n = Number(v || 0);
  if (!Number.isInteger(n) || n < 0 || n > 365) throw new ValidationError('Late fee grace days must be a whole number from 0 to 365');
  return n;
};
const lateFeeCap = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError('Maximum late fee must be 0 or more');
  return n;
};

const getFeeStructuresV2 = async (req, res, next) => {
  try {
    const { status } = req.query;
    const structures = await prisma.feeStructure.findMany({
      where: { institutionId: req.institutionId, ...(status && { status }) },
      include: {
        academicYear: { select: { yearName: true } },
        course: { select: { name: true } },
        items: { include: { feeHead: { select: { name: true } } }, orderBy: { sortOrder: 'asc' } },
        installmentSchedule: { orderBy: { installmentNumber: 'asc' } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, structures, 'Fee structures retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getFeeStructureByIdV2 = async (req, res, next) => {
  try {
    const structure = await prisma.feeStructure.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      include: {
        academicYear: { select: { yearName: true } },
        course: { select: { name: true } },
        items: { include: { feeHead: true }, orderBy: { sortOrder: 'asc' } },
        versions: { select: { id: true, version: true, status: true } },
        installmentSchedule: { orderBy: { installmentNumber: 'asc' } },
        _count: { select: { assignments: true } },
      },
    });
    if (!structure) throw new NotFoundError('Fee structure not found');
    return sendSuccess(res, structure, 'Fee structure retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createFeeStructureV2 = async (req, res, next) => {
  try {
    const { name, academicYearId, courseId, sectionId, dueDate, lateFeePerDay, frequency, items } = req.body;
    if (!name || !academicYearId || !dueDate || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('name, academicYearId, dueDate and at least one fee head item are required');
    }

    const year = await prisma.academicYear.findFirst({ where: { id: academicYearId, institutionId: req.institutionId } });
    if (!year) throw new NotFoundError('Academic year not found or access denied');
    if (courseId) {
      const course = await prisma.course.findFirst({ where: { id: courseId, institutionId: req.institutionId } });
      if (!course) throw new NotFoundError('Course not found or access denied');
    }
    if (sectionId) {
      const section = await prisma.section.findFirst({ where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } } });
      if (!section) throw new NotFoundError('Section not found or access denied');
    }

    const headIds = items.map((i) => i.feeHeadId);
    const heads = await prisma.feeHead.findMany({ where: { id: { in: headIds }, institutionId: req.institutionId } });
    if (heads.length !== new Set(headIds).size) throw new ValidationError('One or more fee heads not found or access denied');

    const totalAmount = items.reduce((sum, i) => sum + Number(i.amount), 0);
    // optional instalment schedule (e.g. Term 1 = 40% by 15 Jun) — percentages add up to 100
    const schedule = parseSchedule(req.body.installments);

    const structure = await prisma.feeStructure.create({
      data: {
        institutionId: req.institutionId,
        academicYearId,
        courseId: courseId || null,
        sectionId: sectionId || null,
        name,
        totalAmount,
        dueDate: new Date(dueDate),
        lateFeePerDay: Number(lateFeePerDay) || 0,
        lateFeeGraceDays: lateFeeGrace(req.body.lateFeeGraceDays),
        lateFeeMaxAmount: lateFeeCap(req.body.lateFeeMaxAmount),
        // this fee's own payment rules on top of the Fee Policy (null = follow the policy)
        ...(req.body.policyOverride !== undefined && { policyOverride: parseOverride(req.body.policyOverride) ?? Prisma.DbNull }),
        frequency: frequency || 'ANNUAL',
        status: 'DRAFT',
        items: {
          create: items.map((i, idx) => ({
            feeHeadId: i.feeHeadId,
            amount: Number(i.amount),
            frequency: i.frequency || frequency || 'ANNUAL',
            dueDate: i.dueDate ? new Date(i.dueDate) : null,
            mandatory: i.mandatory ?? true,
            sortOrder: idx,
            // who pays this head and how much (shared/fees/feeRules.js)
            rule: parseRule(i.rule, heads.find((h) => h.id === i.feeHeadId)?.name) ?? Prisma.DbNull,
          })),
        },
        ...(schedule.length && { installmentSchedule: { create: schedule } }),
      },
      include: { items: { include: { feeHead: true } }, installmentSchedule: { orderBy: { installmentNumber: 'asc' } } },
    });

    return sendSuccess(res, structure, 'Fee structure created as draft', 201);
  } catch (err) {
    next(err);
  }
};

/** Edits are only ever allowed on a DRAFT — a PUBLISHED structure is versioned instead
 * (via /duplicate with asNewVersion), so historical assignments never silently change. */
const updateFeeStructureV2 = async (req, res, next) => {
  try {
    const structure = await prisma.feeStructure.findFirst({ where: { id: req.params.id, institutionId: req.institutionId }, include: { items: true } });
    if (!structure) throw new NotFoundError('Fee structure not found');
    if (structure.status !== 'DRAFT') throw new ValidationError('Only a draft fee structure can be edited — publish a new version instead');

    const { name, dueDate, lateFeePerDay, frequency, items } = req.body;

    if (req.body.installments !== undefined) {
      const schedule = parseSchedule(req.body.installments);
      await prisma.feeStructureInstallment.deleteMany({ where: { feeStructureId: structure.id } });
      if (schedule.length) {
        await prisma.feeStructureInstallment.createMany({ data: schedule.map((s) => ({ ...s, feeStructureId: structure.id })) });
      }
    }

    if (Array.isArray(items)) {
      const headIds = items.map((i) => i.feeHeadId);
      const heads = await prisma.feeHead.findMany({ where: { id: { in: headIds }, institutionId: req.institutionId } });
      if (heads.length !== new Set(headIds).size) throw new ValidationError('One or more fee heads not found or access denied');

      await prisma.feeStructureItem.deleteMany({ where: { feeStructureId: structure.id } });
      await prisma.feeStructureItem.createMany({
        data: items.map((i, idx) => ({
          feeStructureId: structure.id,
          feeHeadId: i.feeHeadId,
          amount: Number(i.amount),
          frequency: i.frequency || frequency || structure.frequency,
          dueDate: i.dueDate ? new Date(i.dueDate) : null,
          mandatory: i.mandatory ?? true,
          sortOrder: idx,
          // who pays this head and how much (shared/fees/feeRules.js)
          rule: parseRule(i.rule, heads.find((h) => h.id === i.feeHeadId)?.name) ?? Prisma.DbNull,
        })),
      });
    }

    const finalItems = Array.isArray(items) ? items : structure.items;
    const totalAmount = finalItems.reduce((sum, i) => sum + Number(i.amount), 0);

    const updated = await prisma.feeStructure.update({
      where: { id: structure.id },
      data: {
        ...(name !== undefined && { name }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(lateFeePerDay !== undefined && { lateFeePerDay: Number(lateFeePerDay) }),
        ...(req.body.lateFeeGraceDays !== undefined && { lateFeeGraceDays: lateFeeGrace(req.body.lateFeeGraceDays) }),
        ...(req.body.lateFeeMaxAmount !== undefined && { lateFeeMaxAmount: lateFeeCap(req.body.lateFeeMaxAmount) }),
        ...(req.body.policyOverride !== undefined && { policyOverride: parseOverride(req.body.policyOverride) ?? Prisma.DbNull }),
        ...(frequency !== undefined && { frequency }),
        totalAmount,
      },
      include: { items: { include: { feeHead: true } }, installmentSchedule: { orderBy: { installmentNumber: 'asc' } } },
    });

    return sendSuccess(res, updated, 'Fee structure updated successfully');
  } catch (err) {
    next(err);
  }
};

const publishFeeStructure = async (req, res, next) => {
  try {
    const structure = await prisma.feeStructure.findFirst({ where: { id: req.params.id, institutionId: req.institutionId }, include: { items: true } });
    if (!structure) throw new NotFoundError('Fee structure not found');
    if (structure.status === 'PUBLISHED') throw new ValidationError('This fee structure is already published');
    if (structure.items.length === 0) throw new ValidationError('Add at least one fee head before publishing');

    const totalAmount = structure.items.reduce((sum, i) => sum + i.amount, 0);
    const updated = await prisma.feeStructure.update({
      where: { id: structure.id },
      data: { status: 'PUBLISHED', totalAmount },
    });
    return sendSuccess(res, updated, 'Fee structure published successfully — it can now be assigned to students');
  } catch (err) {
    next(err);
  }
};

const archiveFeeStructure = async (req, res, next) => {
  try {
    const structure = await prisma.feeStructure.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!structure) throw new NotFoundError('Fee structure not found');
    const updated = await prisma.feeStructure.update({ where: { id: structure.id }, data: { status: 'ARCHIVED' } });
    return sendSuccess(res, updated, 'Fee structure archived successfully');
  } catch (err) {
    next(err);
  }
};

/** Duplicates a structure — either as a fresh independent draft, or (asNewVersion: true) as
 * the next version in the same version chain, so old assignments keep pointing at the
 * exact version they were created under. */
const duplicateFeeStructure = async (req, res, next) => {
  try {
    const source = await prisma.feeStructure.findFirst({ where: { id: req.params.id, institutionId: req.institutionId }, include: { items: true, installmentSchedule: true } });
    if (!source) throw new NotFoundError('Fee structure not found');

    const { name, academicYearId, asNewVersion } = req.body;

    const clone = await prisma.feeStructure.create({
      data: {
        institutionId: req.institutionId,
        academicYearId: academicYearId || source.academicYearId,
        courseId: source.courseId,
        sectionId: source.sectionId,
        name: name || `${source.name}${asNewVersion ? '' : ' (Copy)'}`,
        totalAmount: source.totalAmount,
        dueDate: source.dueDate,
        lateFeePerDay: source.lateFeePerDay,
        lateFeeGraceDays: source.lateFeeGraceDays,
        lateFeeMaxAmount: source.lateFeeMaxAmount,
        policyOverride: source.policyOverride ?? Prisma.DbNull,
        frequency: source.frequency,
        status: 'DRAFT',
        version: asNewVersion ? source.version + 1 : 1,
        parentStructureId: asNewVersion ? (source.parentStructureId || source.id) : null,
        items: {
          create: source.items.map((i, idx) => ({
            feeHeadId: i.feeHeadId, amount: i.amount, frequency: i.frequency, dueDate: i.dueDate, mandatory: i.mandatory, sortOrder: idx, rule: i.rule ?? Prisma.DbNull,
          })),
        },
        ...(source.installmentSchedule.length && {
          installmentSchedule: {
            create: source.installmentSchedule.map((s) => ({ installmentNumber: s.installmentNumber, label: s.label, percent: s.percent, dueDate: s.dueDate })),
          },
        }),
      },
      include: { items: { include: { feeHead: true } } },
    });

    return sendSuccess(res, clone, asNewVersion ? 'New version created as draft' : 'Fee structure duplicated as draft', 201);
  } catch (err) {
    next(err);
  }
};

/** Creates one student's assignment for a structure (loaded with items.feeHead), snapshotting each fee head. */
/** Assigns one structure to one student under its fee rules (shared/fees/feeRules.js) —
 * each head at the amount the rules give this student; heads that don't apply are left out.
 * Returns null when the rules charge this student nothing. */
const assignStructureWithinTx = (tx, structure, studentId) => assignResolvedStructure(tx, structure, studentId);

/** Assigns a PUBLISHED structure to every matching active student (institution + course +
 * section, whichever are set on the structure), snapshotting each fee head's amount into a
 * StudentFeeItem row — skips students already assigned to this exact structure. */
const assignStructureToStudents = async (req, res, next) => {
  try {
    const structure = await prisma.feeStructure.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      include: { items: { include: { feeHead: true } }, installmentSchedule: true },
    });
    if (!structure) throw new NotFoundError('Fee structure not found');
    if (structure.status !== 'PUBLISHED') throw new ValidationError('Only a published fee structure can be assigned to students');

    const students = await prisma.student.findMany({
      where: {
        institutionId: req.institutionId,
        status: 'ACTIVE',
        ...(structure.courseId && { courseId: structure.courseId }),
        ...(structure.sectionId && { sectionId: structure.sectionId }),
      },
      select: { id: true },
    });

    let assignedCount = 0;
    let skippedCount = 0;
    let otherVersionCount = 0;
    let notChargedCount = 0;

    // A student holds ONE version of a fee. Students who already have this structure, or
    // any other version of it (v1 when assigning v2, ...), are skipped and keep the version
    // they have — assigning a new version used to charge them for both.
    // (One query for everyone, not one lookup per student.)
    const chainIds = await versionChainIds(prisma, structure);
    const existing = await prisma.studentFeeAssignment.findMany({
      where: { feeStructureId: { in: chainIds } },
      select: { studentId: true, feeStructureId: true },
    });
    const sameStructure = new Set(existing.filter((a) => a.feeStructureId === structure.id).map((a) => a.studentId));
    const anyVersion = new Set(existing.map((a) => a.studentId));

    for (const student of students) {
      if (anyVersion.has(student.id)) {
        if (sameStructure.has(student.id)) skippedCount += 1;
        else otherVersionCount += 1;
        continue;
      }

      const created = await prisma.$transaction((tx) => assignStructureWithinTx(tx, structure, student.id));
      if (created) assignedCount += 1; else notChargedCount += 1; // its fee rules charge this student nothing
    }

    const notes = [
      skippedCount > 0 && `${skippedCount} already had this structure assigned`,
      otherVersionCount > 0 && `${otherVersionCount} already have another version of this fee and keep it`,
      notChargedCount > 0 && `${notChargedCount} not charged under its fee rules`,
    ].filter(Boolean);
    return sendSuccess(
      res,
      { assignedCount, skippedCount, otherVersionCount, notChargedCount, totalStudents: students.length },
      `Fee structure assigned to ${assignedCount} student(s)${notes.length ? ` (${notes.join('; ')})` : ''}`
    );
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Student Fee Breakdown (dynamic per-head — Student Fee Page)
// ============================================================

const getStudentFeeItems = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');
    // Fee Policy "use credit automatically": settle new dues from any credit first
    await autoApplyCredit(prisma, { institutionId: req.institutionId, studentId: student.id });

    const assignments = await prisma.studentFeeAssignment.findMany({
      where: { studentId: req.params.id },
      include: {
        feeStructure: { select: { name: true, status: true, academicYear: { select: { yearName: true } } } },
        items: { orderBy: { feeHeadName: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // each fee's instalments (due dates, paid, which heads they cover)
    await attachInstallments(prisma, assignments);
    for (const a of assignments) a.lateFee = await refreshLateFee(prisma, a.id);

    return sendSuccess(res, assignments, 'Student fee breakdown retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Multi-Item Fee Payment (Layer 3 — one payment, many allocations)
// ============================================================

const collectFeePaymentV2 = async (req, res, next) => {
  try {
    const { studentId, allocations, paymentMode, transactionReference, bankName, chequeNumber, chequeDate, remarks, idempotencyKey } = req.body;
    if (!studentId || !Array.isArray(allocations) || allocations.length === 0) {
      throw new ValidationError('studentId and at least one fee item allocation are required');
    }

    if (idempotencyKey) {
      const existingPayment = await prisma.feePayment.findUnique({ where: { idempotencyKey } });
      if (existingPayment) {
        return sendSuccess(res, { payment: existingPayment, duplicate: true }, 'This payment was already recorded — duplicate request ignored');
      }
    }

    const itemIds = allocations.map((a) => a.studentFeeItemId);
    const items = await prisma.studentFeeItem.findMany({
      where: { id: { in: itemIds }, studentFeeAssignment: { studentId, feeStructure: { institutionId: req.institutionId } } },
    });
    if (items.length !== new Set(itemIds).size) throw new NotFoundError('One or more fee items not found or access denied');

    const distinctAssignments = new Set(items.map((i) => i.studentFeeAssignmentId));
    if (distinctAssignments.size > 1) throw new ValidationError('All fee items in one payment must belong to the same fee structure assignment');
    const assignmentId = [...distinctAssignments][0];
    if (paymentMode === 'CREDIT') throw new ValidationError('Use "Pay from credit" to pay a fee from the student\'s credit');
    // bring the late fee up to date BEFORE this payment, so lateness counts up to today
    const lateFee = await refreshLateFee(prisma, assignmentId);

    for (const alloc of allocations) {
      const item = items.find((i) => i.id === alloc.studentFeeItemId);
      if (Number(alloc.amount) <= 0) throw new ValidationError(`Allocation amount for ${item.feeHeadName} must be greater than zero`);
      if (Number(alloc.amount) > item.dueAmount + 0.01) throw new ValidationError(`Allocation for ${item.feeHeadName} (₹${alloc.amount}) exceeds its due amount (₹${item.dueAmount})`);
    }

    const totalAmount = allocations.reduce((sum, a) => sum + Number(a.amount), 0);

    // Fee Policy (shared/fees/feePolicy.js): head order, part payments, minimum, older fee
    // first, and the late fee (lateFeeAmount — paid in the same payment when FIRST / LAST)
    const full = await prisma.studentFeeAssignment.findUnique({
      where: { id: assignmentId },
      include: { feeStructure: { select: { policyOverride: true } }, installments: true },
    });
    const policy = effectivePolicy(await getFeePolicy(prisma, req.institutionId), full.feeStructure);
    const overrideReason = req.body.overrideReason ? String(req.body.overrideReason).trim().slice(0, 300) : null;
    const lateFeeAmount = round2(Number(req.body.lateFeeAmount) || 0);
    if (lateFeeAmount < 0) throw new ValidationError('lateFeeAmount cannot be negative');
    if (lateFeeAmount > 0 && policy.lateFeeOrder === 'SEPARATE') throw new ValidationError('Late fees are collected separately (Fees → Late Fees) under your Fee Policy');
    if (lateFeeAmount > lateFee.due + 0.01) throw new ValidationError(`Late fee ₹${lateFeeAmount} is more than the late fee due (₹${lateFee.due})`);
    // previous academic year's dues (Fee Policy) — head-wise collection is for one fee, so
    // AUTO_ADJUST can't spread here: both BLOCK and AUTO_ADJUST refuse (override as the policy allows)
    await enforcePreviousDues(prisma, { policy, assignment: full, channel: 'COUNTER_HEADS', overrideReason });
    if (!overrideReason) {
      if (!policy.counterHeadChoice) checkHeadOrder(await itemsInHeadOrder(prisma, assignmentId, full.feeStructureId), allocations);
      if (policy.lateFeeOrder === 'FIRST' && lateFeeAmount < lateFee.due - 0.009) {
        throw new BusinessRuleError(`The late fee of ₹${lateFee.due} must be paid first — include it in this payment`);
      }
      if (policy.lateFeeOrder === 'LAST' && lateFeeAmount > 0 && totalAmount < full.dueAmount - 0.009) {
        throw new BusinessRuleError('The late fee is collected only after the fee itself is fully paid');
      }
      checkPartialRules(policy, {
        feeDue: full.dueAmount, installments: full.installments, feeAmount: totalAmount, total: round2(totalAmount + lateFeeAmount),
        lateFirst: policy.lateFeeOrder === 'FIRST' ? lateFee.due : 0, channel: 'COUNTER',
      });
      if (policy.oldestFeeFirst) {
        const older = await olderUnpaidFee(prisma, full);
        if (older) throw new BusinessRuleError(`Clear the older fee "${older.feeStructure.name}" (₹${older.dueAmount} due) first`);
      }
    }

    const inst = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });
    const receiptCount = await prisma.feeReceipt.count({ where: { institutionId: req.institutionId } });
    const receiptNumber = generateReceiptNumber(inst ? inst.code : 'SCOMS', receiptCount + 1);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          institutionId: req.institutionId,
          studentId,
          studentFeeAssignmentId: assignmentId,
          idempotencyKey: idempotencyKey || undefined,
          amountPaid: totalAmount,
          paymentMode: paymentMode || 'CASH',
          paymentStatus: 'SUCCESS',
          transactionReference,
          bankName,
          chequeNumber,
          chequeDate: chequeDate ? new Date(chequeDate) : undefined,
          receivedBy: req.user.email,
          remarks,
        },
      });

      await tx.paymentAllocation.createMany({
        data: allocations.map((a) => ({ feePaymentId: payment.id, studentFeeItemId: a.studentFeeItemId, amount: Number(a.amount) })),
      });

      for (const alloc of allocations) {
        const item = items.find((i) => i.id === alloc.studentFeeItemId);
        const newPaid = item.paidAmount + Number(alloc.amount);
        const newDue = Math.max(0, item.amount - item.discountAmount - newPaid);
        await tx.studentFeeItem.update({
          where: { id: item.id },
          data: { paidAmount: newPaid, dueAmount: newDue, status: newDue <= 0 ? 'PAID' : 'PARTIAL' },
        });
      }

      const allItems = await tx.studentFeeItem.findMany({ where: { studentFeeAssignmentId: assignmentId } });
      const assignPaid = allItems.reduce((sum, i) => sum + i.paidAmount, 0);
      const assignDue = allItems.reduce((sum, i) => sum + i.dueAmount, 0);
      await tx.studentFeeAssignment.update({
        where: { id: assignmentId },
        data: { paidAmount: assignPaid, dueAmount: assignDue, status: assignDue <= 0 ? 'PAID' : assignPaid > 0 ? 'PARTIAL' : 'PENDING' },
      });
      // instalments follow the payment too (shared/fees/installments.js)
      await recomputeInstallments(tx, assignmentId);

      const receipt = await tx.feeReceipt.create({
        data: { receiptNumber, institutionId: req.institutionId, studentId, paymentId: payment.id, amount: totalAmount },
      });
      const lateFeeEntry = await recordLatePart(tx, {
        institutionId: req.institutionId, assignmentId, amount: lateFeeAmount, paymentMode: paymentMode || 'CASH', receiptNumber, userId: req.user.id,
      });

      return {
        payment, receipt,
        allocations: allocations.map((a) => ({ ...a, feeHeadName: items.find((i) => i.id === a.studentFeeItemId)?.feeHeadName })),
        ...(lateFeeEntry && { lateFeeReceipt: lateFeeEntry.receiptNumber, lateFeePaid: lateFeeAmount }),
      };
    });

    if (overrideReason) {
      prisma.auditLog.create({
        data: { institutionId: req.institutionId, userId: req.user.id, action: 'FEE_POLICY_OVERRIDDEN', module: 'FEES', entity: 'StudentFeeAssignment', entityId: assignmentId, newValues: JSON.stringify({ amount: totalAmount, reason: overrideReason }) },
      }).catch(() => {});
    }
    return sendSuccess(res, result, 'Fee payment collected and receipt generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** Re-printing a receipt only ever increments a counter and timestamp — the financial
 * fields (amount, payment date, transaction reference, receipt number) are never touched. */
const reprintReceiptV2 = async (req, res, next) => {
  try {
    const receipt = await prisma.feeReceipt.findFirst({
      where: { institutionId: req.institutionId, OR: [{ id: req.params.id }, { receiptNumber: req.params.id }] },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, admissionNumber: true, course: { select: { name: true } }, section: { select: { name: true } } } },
        payment: { include: { allocations: { include: { studentFeeItem: true } } } },
      },
    });
    if (!receipt) throw new NotFoundError('Receipt not found');

    const updated = await prisma.feeReceipt.update({
      where: { id: receipt.id },
      data: { printCount: { increment: 1 }, lastPrintedAt: new Date() },
    });

    return sendSuccess(res, { ...receipt, printCount: updated.printCount, lastPrintedAt: updated.lastPrintedAt, isReprint: updated.printCount > 1 }, 'Receipt ready');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  assignStructureWithinTx,
  getFeeCategoriesV2,
  createFeeCategory,
  getFeeHeads,
  createFeeHead,
  updateFeeHead,
  deactivateFeeHead,
  getFeeStructuresV2,
  getFeeStructureByIdV2,
  createFeeStructureV2,
  updateFeeStructureV2,
  publishFeeStructure,
  archiveFeeStructure,
  duplicateFeeStructure,
  assignStructureToStudents,
  getStudentFeeItems,
  collectFeePaymentV2,
  reprintReceiptV2,
};
