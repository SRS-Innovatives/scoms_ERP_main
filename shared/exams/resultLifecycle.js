/**
 * Exam Result Lifecycle - shared by IntituteAdmin_Backend and Staff_backend so both
 * portals apply the same state machine and audit trail.
 *
 *   DRAFT --submit--> SUBMITTED --verify--> VERIFIED --approve--> APPROVED --publish--> (isPublished)
 *     ^                   |                     |                     |
 *     +------------------ return (with remarks) ----------------------+
 *
 * Opt-in per institution (InstitutionSettings.examApprovalRequired, default false):
 *   - off: the legacy flow is unchanged - marks stay editable until published and the
 *     existing publish endpoints work from any status. Submit/verify/approve can still be
 *     used, but are informational.
 *   - on:  marks lock as soon as they're submitted, and publishing requires APPROVED.
 *
 * Once marks are locked, changes go through a MarkCorrectionRequest that someone other
 * than the requester approves; the request row (old -> new) is the correction audit trail.
 */
const prisma = require('../database/client');
const { getGradeScale, resolveGrade } = require('../utils/grading');
const { NotFoundError, BusinessRuleError, ValidationError } = require('../errors/customErrors');
const logger = require('../utils/logger');

const isApprovalRequired = async (institutionId, db = prisma) => {
  const settings = await db.institutionSettings.findUnique({
    where: { institutionId },
    select: { examApprovalRequired: true },
  });
  return !!settings?.examApprovalRequired;
};

const loadSchedule = async (scheduleId, institutionId, db = prisma) => {
  const schedule = await db.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId } } });
  if (!schedule) throw new NotFoundError('Exam schedule not found');
  return schedule;
};

const isLocked = (schedule, approvalRequired) =>
  schedule.isPublished || (approvalRequired && schedule.markStatus !== 'DRAFT');

/** Throws if marks can't be edited directly right now. */
const assertMarksEditable = async (schedule, institutionId) => {
  if (schedule.isPublished) {
    throw new BusinessRuleError('Results for this subject are already published and locked. Raise a correction request, or ask an admin to unlock it.');
  }
  if (schedule.markStatus !== 'DRAFT' && (await isApprovalRequired(institutionId))) {
    throw new BusinessRuleError(`Marks are ${schedule.markStatus.toLowerCase()} and locked for review. Raise a correction request, or have the reviewer return them for changes.`);
  }
};

/** Throws if this schedule can't be published yet. */
const assertPublishable = async (schedule, institutionId) => {
  if (schedule.markStatus !== 'APPROVED' && (await isApprovalRequired(institutionId))) {
    throw new BusinessRuleError(`Marks must be approved before publishing (current status: ${schedule.markStatus}). Submit them for verification first.`);
  }
};

const audit = (institutionId, userId, action, scheduleId, details) =>
  prisma.auditLog
    .create({
      data: {
        institutionId,
        userId,
        action,
        module: 'EXAMINATION',
        entity: 'ExamSchedule',
        entityId: scheduleId,
        ...(details && { newValues: JSON.stringify(details) }),
      },
    })
    .catch((err) => logger.warn('[ResultLifecycle] audit log write failed', { error: err.message }));

const transition = async ({ scheduleId, institutionId, userId, from, data, action, details }) => {
  const result = await prisma.examSchedule.updateMany({
    where: { id: scheduleId, exam: { institutionId }, isPublished: false, markStatus: { in: from } },
    data,
  });
  if (result.count === 0) throw new BusinessRuleError('This exam schedule changed status in the meantime - refresh and try again');
  await audit(institutionId, userId, action, scheduleId, details);
  return prisma.examSchedule.findUnique({ where: { id: scheduleId } });
};

const submitMarks = async ({ scheduleId, institutionId, userId }) => {
  const schedule = await loadSchedule(scheduleId, institutionId);
  if (schedule.isPublished) throw new BusinessRuleError('Already published');
  if (schedule.markStatus !== 'DRAFT') throw new BusinessRuleError(`Already ${schedule.markStatus.toLowerCase()}`);

  const [entered, rosterSize] = await Promise.all([
    prisma.studentMark.count({ where: { examScheduleId: scheduleId } }),
    prisma.student.count({ where: { courseId: schedule.courseId, institutionId, status: 'ACTIVE' } }),
  ]);
  if (entered === 0) throw new BusinessRuleError('Enter marks for at least one student before submitting');

  const updated = await transition({
    scheduleId,
    institutionId,
    userId,
    from: ['DRAFT'],
    data: { markStatus: 'SUBMITTED', submittedById: userId, submittedAt: new Date(), reviewRemarks: null },
    action: 'MARKS_SUBMITTED',
    details: { entered, rosterSize },
  });
  return { schedule: updated, entered, rosterSize, missing: Math.max(rosterSize - entered, 0) };
};

const verifyMarks = async ({ scheduleId, institutionId, userId }) => {
  const schedule = await loadSchedule(scheduleId, institutionId);
  if (schedule.markStatus !== 'SUBMITTED') throw new BusinessRuleError(`Only submitted marks can be verified (current status: ${schedule.markStatus})`);
  if (schedule.submittedById === userId) throw new BusinessRuleError('Marks must be verified by someone other than the person who submitted them');

  return transition({
    scheduleId,
    institutionId,
    userId,
    from: ['SUBMITTED'],
    data: { markStatus: 'VERIFIED', verifiedById: userId, verifiedAt: new Date() },
    action: 'MARKS_VERIFIED',
  });
};

const approveMarks = async ({ scheduleId, institutionId, userId }) => {
  const schedule = await loadSchedule(scheduleId, institutionId);
  if (schedule.markStatus !== 'VERIFIED') throw new BusinessRuleError(`Only verified marks can be approved (current status: ${schedule.markStatus})`);
  if (schedule.submittedById === userId) throw new BusinessRuleError('Marks must be approved by someone other than the person who submitted them');

  return transition({
    scheduleId,
    institutionId,
    userId,
    from: ['VERIFIED'],
    data: { markStatus: 'APPROVED', approvedById: userId, approvedAt: new Date() },
    action: 'MARKS_APPROVED',
  });
};

const returnMarks = async ({ scheduleId, institutionId, userId, remarks }) => {
  if (!remarks || !String(remarks).trim()) throw new ValidationError('A reason is required when returning marks for changes');
  const schedule = await loadSchedule(scheduleId, institutionId);
  if (schedule.isPublished) throw new BusinessRuleError('Published results must be unlocked by an admin, not returned');
  if (schedule.markStatus === 'DRAFT') throw new BusinessRuleError('Marks are still in draft - nothing to return');

  return transition({
    scheduleId,
    institutionId,
    userId,
    from: ['SUBMITTED', 'VERIFIED', 'APPROVED'],
    data: { markStatus: 'DRAFT', reviewRemarks: String(remarks).trim(), verifiedById: null, verifiedAt: null, approvedById: null, approvedAt: null },
    action: 'MARKS_RETURNED',
    details: { from: schedule.markStatus, remarks },
  });
};

/** Called when an admin unlocks a published result: it goes back through review. */
const resetForCorrection = (scheduleId) =>
  prisma.examSchedule.update({
    where: { id: scheduleId },
    data: { markStatus: 'DRAFT', verifiedById: null, verifiedAt: null, approvedById: null, approvedAt: null },
  });

// ------------------------------------------------------------------
// Correction requests (post-lock changes, with audit trail)
// ------------------------------------------------------------------
const createCorrectionRequest = async ({ scheduleId, institutionId, userId, studentId, newMarks, newIsAbsent, reason }) => {
  if (!studentId) throw new ValidationError('studentId is required');
  if (!reason || !String(reason).trim()) throw new ValidationError('A reason is required for a mark correction');

  const schedule = await loadSchedule(scheduleId, institutionId);
  if (!isLocked(schedule, await isApprovalRequired(institutionId))) {
    throw new BusinessRuleError('These marks are still editable - change them directly instead of raising a correction');
  }

  const student = await prisma.student.findFirst({ where: { id: studentId, institutionId, courseId: schedule.courseId } });
  if (!student) throw new NotFoundError('Student not found in this exam\'s class');

  const absent = !!newIsAbsent;
  const marks = absent ? null : Number(newMarks);
  if (!absent && (Number.isNaN(marks) || marks < 0 || marks > schedule.maxMarks)) {
    throw new ValidationError(`New marks must be between 0 and ${schedule.maxMarks}`);
  }

  const pending = await prisma.markCorrectionRequest.findFirst({ where: { examScheduleId: scheduleId, studentId, status: 'PENDING' } });
  if (pending) throw new BusinessRuleError('A correction request for this student is already pending review');

  const current = await prisma.studentMark.findUnique({ where: { examScheduleId_studentId: { examScheduleId: scheduleId, studentId } } });

  const request = await prisma.markCorrectionRequest.create({
    data: {
      institutionId,
      examScheduleId: scheduleId,
      studentId,
      requestedById: userId,
      oldMarks: current ? current.marksObtained : null,
      oldIsAbsent: current ? current.isAbsent : null,
      newMarks: marks,
      newIsAbsent: absent,
      reason: String(reason).trim(),
    },
  });
  await audit(institutionId, userId, 'MARK_CORRECTION_REQUESTED', scheduleId, { requestId: request.id, studentId });
  return request;
};

const listCorrectionRequests = ({ institutionId, scheduleId, status, requestedById }) =>
  prisma.markCorrectionRequest.findMany({
    where: {
      institutionId,
      ...(scheduleId && { examScheduleId: scheduleId }),
      ...(status && { status }),
      ...(requestedById && { requestedById }),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
      examSchedule: {
        select: {
          id: true,
          maxMarks: true,
          isPublished: true,
          markStatus: true,
          subject: { select: { name: true, code: true } },
          exam: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const reviewCorrectionRequest = async ({ requestId, institutionId, userId, decision, remarks }) => {
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new ValidationError('decision must be APPROVE or REJECT');
  const request = await prisma.markCorrectionRequest.findFirst({ where: { id: requestId, institutionId } });
  if (!request) throw new NotFoundError('Correction request not found');
  if (request.status !== 'PENDING') throw new BusinessRuleError(`This request was already ${request.status.toLowerCase()}`);
  if (request.requestedById === userId) throw new BusinessRuleError('A correction must be reviewed by someone other than the requester');
  if (decision === 'REJECT' && !(remarks && String(remarks).trim())) throw new ValidationError('A reason is required when rejecting a correction');

  const reviewed = { reviewedById: userId, reviewedAt: new Date(), reviewRemarks: remarks ? String(remarks).trim() : null };

  if (decision === 'REJECT') {
    const updated = await prisma.markCorrectionRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', ...reviewed } });
    await audit(institutionId, userId, 'MARK_CORRECTION_REJECTED', request.examScheduleId, { requestId });
    return updated;
  }

  const schedule = await loadSchedule(request.examScheduleId, institutionId);
  const scale = await getGradeScale(institutionId);
  const isAbsent = request.newIsAbsent;
  const marksObtained = isAbsent ? 0 : request.newMarks;
  const grade = isAbsent ? 'AB' : resolveGrade(scale, marksObtained, schedule.maxMarks);

  const [updated] = await prisma.$transaction([
    prisma.markCorrectionRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', ...reviewed } }),
    prisma.studentMark.upsert({
      where: { examScheduleId_studentId: { examScheduleId: request.examScheduleId, studentId: request.studentId } },
      create: { examScheduleId: request.examScheduleId, studentId: request.studentId, marksObtained, grade, isAbsent },
      update: { marksObtained, grade, isAbsent },
    }),
  ]);
  await audit(institutionId, userId, 'MARK_CORRECTION_APPLIED', request.examScheduleId, {
    requestId,
    studentId: request.studentId,
    old: { marks: request.oldMarks, isAbsent: request.oldIsAbsent },
    new: { marks: request.newMarks, isAbsent: request.newIsAbsent },
  });
  return updated;
};

module.exports = {
  isApprovalRequired,
  isLocked,
  assertMarksEditable,
  assertPublishable,
  submitMarks,
  verifyMarks,
  approveMarks,
  returnMarks,
  resetForCorrection,
  createCorrectionRequest,
  listCorrectionRequests,
  reviewCorrectionRequest,
};
