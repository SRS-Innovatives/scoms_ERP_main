/**
 * Institute Admin — fee rules and automatic assignment (Phase 3):
 *   rule options       the values a fee rule can test (quotas, categories, routes, …)
 *   recalculate fees   one student, or a whole class: preview, then apply
 *                      (shared/fees/feeSync.js — uses the Fee Policy's mid-year setting)
 *   fees on leaving    preview / apply the policy's onLeaving (shared/fees/leaving.js)
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError } = require('../../../shared');
const { getFeePolicy, ENUMS } = require('../../../shared/fees/feePolicy');
const { planStudentFeeSync, planFeeSyncForStudents, applyStudentFeeSync } = require('../../../shared/fees/feeSync');
const { planLeavingSettlement, applyLeavingSettlement } = require('../../../shared/fees/leaving');

const audit = (req, action, entityId, details) => prisma.auditLog.create({
  data: { institutionId: req.institutionId, userId: req.user.id, action, module: 'FEES', entity: 'Student', entityId, newValues: JSON.stringify(details) },
}).catch(() => {});

const studentIn = async (id, institutionId) => {
  const s = await prisma.student.findFirst({ where: { id, institutionId }, select: { id: true, firstName: true, lastName: true, admissionNumber: true, status: true } });
  if (!s) throw new NotFoundError('Student not found');
  return s;
};

/** GET /fees/rule-options — what the fee-rule editor offers. */
const getRuleOptions = async (req, res, next) => {
  try {
    const where = { institutionId: req.institutionId };
    const [quotas, categories, routes, hostels, customFields] = await Promise.all([
      prisma.student.findMany({ where: { ...where, admissionQuota: { not: null } }, select: { admissionQuota: true }, distinct: ['admissionQuota'], take: 100 }),
      prisma.student.findMany({ where: { ...where, category: { not: null } }, select: { category: true }, distinct: ['category'], take: 100 }),
      prisma.transportRoute.findMany({ where, select: { id: true, routeName: true, monthlyFare: true }, orderBy: { routeName: 'asc' } }),
      prisma.hostel.findMany({ where, select: { id: true, name: true, type: true }, orderBy: { name: 'asc' } }),
      prisma.admissionCustomField.findMany({ where: { ...where, entityType: 'ADMISSION', status: 'APPROVED' }, select: { fieldKey: true, label: true, options: true, fieldType: true }, orderBy: { order: 'asc' } }),
    ]);
    const clean = (list, key) => [...new Set(list.map((x) => String(x[key] || '').trim()).filter(Boolean))].sort();
    return sendSuccess(res, {
      quotas: clean(quotas, 'admissionQuota'),
      categories: clean(categories, 'category'),
      genders: ['MALE', 'FEMALE', 'OTHER'],
      routes,
      hostels,
      customFields,
      midYearChange: ENUMS.midYearChange,
      onLeaving: ENUMS.onLeaving,
    }, 'Fee rule options retrieved');
  } catch (err) {
    next(err);
  }
};

/** GET /fees/students/:studentId/fee-sync — what "Recalculate fees" would do. */
const previewStudentSync = async (req, res, next) => {
  try {
    const student = await studentIn(req.params.studentId, req.institutionId);
    const plan = await planStudentFeeSync(prisma, { institutionId: req.institutionId, studentId: student.id, event: 'MANUAL' });
    return sendSuccess(res, { student, ...plan }, 'Fee recalculation preview');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/students/:studentId/fee-sync — applies it. */
const applyStudentSync = async (req, res, next) => {
  try {
    const student = await studentIn(req.params.studentId, req.institutionId);
    if (student.status !== 'ACTIVE') throw new BusinessRuleError('Fees are recalculated only for active students');
    const plan = await planStudentFeeSync(prisma, { institutionId: req.institutionId, studentId: student.id, event: 'MANUAL' });
    const summary = await applyStudentFeeSync(prisma, { institutionId: req.institutionId, studentId: student.id, plan });
    audit(req, 'FEES_RECALCULATED', student.id, summary);
    const n = summary.assigned.length + summary.adjusted.length;
    return sendSuccess(res, { ...summary, deferred: plan.deferred }, n ? `${summary.assigned.length} fee(s) assigned, ${summary.adjusted.length} adjusted` : 'Fees are already up to date');
  } catch (err) {
    next(err);
  }
};

const classScope = async (req) => {
  const { courseId, sectionId } = { ...req.query, ...req.body };
  if (!courseId && !sectionId) throw new ValidationError('Choose a class or section');
  const students = await prisma.student.findMany({
    where: { institutionId: req.institutionId, status: 'ACTIVE', ...(courseId && { courseId }), ...(sectionId && { sectionId }) },
    select: { id: true, firstName: true, lastName: true, admissionNumber: true },
    orderBy: [{ firstName: 'asc' }],
    take: 2000,
  });
  return students;
};

/** GET /fees/fee-sync/class?courseId=|sectionId= — preview for every active student in it. */
const previewClassSync = async (req, res, next) => {
  try {
    const students = await classScope(req);
    const policy = await getFeePolicy(prisma, req.institutionId);
    // the whole class planned in a handful of queries (shared/fees/feeSync.js)
    const plans = await planFeeSyncForStudents(prisma, { institutionId: req.institutionId, studentIds: students.map((s) => s.id), event: 'MANUAL', policy });
    const rows = [];
    for (const s of students) {
      const plan = plans.get(s.id);
      if (plan.assign.length || plan.adjust.length || plan.deferred.length) rows.push({ student: s, assign: plan.assign, adjust: plan.adjust, deferred: plan.deferred });
    }
    return sendSuccess(res, { students: students.length, affected: rows.length, mode: policy.midYearChange, rows }, 'Class fee recalculation preview');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/fee-sync/class { courseId | sectionId } — applies it for every active student. */
const applyClassSync = async (req, res, next) => {
  try {
    const students = await classScope(req);
    const policy = await getFeePolicy(prisma, req.institutionId);
    const plans = await planFeeSyncForStudents(prisma, { institutionId: req.institutionId, studentIds: students.map((s) => s.id), event: 'MANUAL', policy });
    let assigned = 0;
    let adjusted = 0;
    for (const s of students) {
      const plan = plans.get(s.id);
      if (!plan || (!plan.assign.length && !plan.adjust.length)) continue;
      const r = await applyStudentFeeSync(prisma, { institutionId: req.institutionId, studentId: s.id, plan });
      assigned += r.assigned.length;
      adjusted += r.adjusted.length;
    }
    audit(req, 'FEES_RECALCULATED_FOR_CLASS', null, { ...req.body, students: students.length, assigned, adjusted });
    return sendSuccess(res, { students: students.length, assigned, adjusted }, `${assigned} fee(s) assigned, ${adjusted} adjusted across ${students.length} student(s)`);
  } catch (err) {
    next(err);
  }
};

const leavingMode = async (req) => {
  const policy = await getFeePolicy(prisma, req.institutionId);
  const mode = req.query.mode || req.body?.mode || policy.onLeaving;
  if (!ENUMS.onLeaving.includes(mode)) throw new ValidationError(`mode must be one of ${ENUMS.onLeaving.join(', ')}`);
  return { mode, policyMode: policy.onLeaving };
};

/** GET /fees/students/:studentId/leaving-settlement?mode= — preview (default: the policy's). */
const previewLeaving = async (req, res, next) => {
  try {
    const student = await studentIn(req.params.studentId, req.institutionId);
    const { mode, policyMode } = await leavingMode(req);
    const plan = await planLeavingSettlement(prisma, { institutionId: req.institutionId, studentId: student.id, mode });
    return sendSuccess(res, { student, policyMode, ...plan }, 'Leaving settlement preview');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/students/:studentId/leaving-settlement { mode?, reason } */
const applyLeaving = async (req, res, next) => {
  try {
    const student = await studentIn(req.params.studentId, req.institutionId);
    const { mode } = await leavingMode(req);
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new ValidationError('A reason is required');
    if (mode === 'KEEP') throw new BusinessRuleError('"Keep all dues" changes nothing — collect the fees or choose another option');
    const exiting = await prisma.studentExitRecord.findFirst({ where: { studentId: student.id, institutionId: req.institutionId, status: { in: ['REQUESTED', 'CLEARANCE_PENDING', 'APPROVED', 'COMPLETED'] } } });
    if (!exiting && student.status === 'ACTIVE') throw new BusinessRuleError('Start a withdrawal / transfer for this student first (Student Exit)');
    const plan = await applyLeavingSettlement(prisma, { institutionId: req.institutionId, studentId: student.id, mode, reason, userId: req.user.id });
    return sendSuccess(res, plan, `₹${plan.totalWaive.toLocaleString('en-IN')} ${mode === 'WRITE_OFF' ? 'written off' : 'cancelled'} — ₹${plan.remaining.toLocaleString('en-IN')} still due`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRuleOptions, previewStudentSync, applyStudentSync, previewClassSync, applyClassSync, previewLeaving, applyLeaving };
