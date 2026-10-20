/**
 * Attendance rules shared by IntituteAdmin_Backend, Staff_backend, Student_Backend and the
 * report engine, so every portal counts attendance and applies the edit lock the same way.
 *
 * Lock is opt-in per institution (InstitutionSettings.attendanceLockDays, default null):
 *   - null: sessions stay editable forever (legacy behaviour).
 *   - N:    sessions older than N days can't be edited or back-filled directly; changes go
 *           through an AttendanceCorrectionRequest that someone other than the requester
 *           approves. The request row (old -> new) is the correction audit trail.
 */
const prisma = require('../database/client');
const { NotFoundError, BusinessRuleError, ValidationError } = require('../errors/customErrors');
const logger = require('../utils/logger');

const ATTENDED_STATUSES = ['PRESENT', 'LATE', 'ON_DUTY'];
const ALL_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY', 'ON_DUTY'];
const DAY_MS = 24 * 60 * 60 * 1000;

const isAttended = (status) => ATTENDED_STATUSES.includes(status);

const getLockDays = async (institutionId, db = prisma) => {
  const settings = await db.institutionSettings.findUnique({
    where: { institutionId },
    select: { attendanceLockDays: true },
  });
  const days = settings?.attendanceLockDays;
  return Number.isInteger(days) && days >= 0 ? days : null;
};

const startOfUtcDay = (d) => {
  const date = new Date(d);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const isDateLocked = (date, lockDays, now = new Date()) =>
  lockDays !== null && (startOfUtcDay(now) - startOfUtcDay(date)) / DAY_MS > lockDays;

/** Throws if attendance for this date can't be recorded or edited directly. */
const assertDateEditable = async (date, institutionId) => {
  const lockDays = await getLockDays(institutionId);
  if (isDateLocked(date, lockDays)) {
    throw new BusinessRuleError(`Attendance older than ${lockDays} day(s) is locked. Raise a correction request for approval instead.`);
  }
};

const audit = (institutionId, userId, action, sessionId, details) =>
  prisma.auditLog
    .create({
      data: {
        institutionId,
        userId,
        action,
        module: 'ATTENDANCE',
        entity: 'AttendanceSession',
        entityId: sessionId,
        ...(details && { newValues: JSON.stringify(details) }),
      },
    })
    .catch((err) => logger.warn('[AttendanceRules] audit log write failed', { error: err.message }));

const createCorrectionRequest = async ({ sessionId, institutionId, userId, studentId, newStatus, reason }) => {
  if (!ALL_STATUSES.includes(newStatus)) throw new ValidationError(`newStatus must be one of ${ALL_STATUSES.join(', ')}`);
  if (!(reason && String(reason).trim())) throw new ValidationError('A reason is required for an attendance correction');

  const session = await prisma.attendanceSession.findFirst({ where: { id: sessionId, institutionId } });
  if (!session) throw new NotFoundError('Attendance session not found');

  const student = await prisma.student.findFirst({ where: { id: studentId, institutionId, sectionId: session.sectionId } });
  if (!student) throw new ValidationError('Student is not in this class');

  const existing = await prisma.attendanceRecord.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
    select: { status: true },
  });
  if (existing?.status === newStatus) throw new ValidationError(`Student is already marked ${newStatus}`);

  const pending = await prisma.attendanceCorrectionRequest.findFirst({ where: { sessionId, studentId, status: 'PENDING' } });
  if (pending) throw new BusinessRuleError('A correction request for this student is already pending');

  const request = await prisma.attendanceCorrectionRequest.create({
    data: {
      institutionId,
      sessionId,
      studentId,
      requestedById: userId,
      oldStatus: existing?.status ?? null,
      newStatus,
      reason: String(reason).trim(),
    },
  });
  await audit(institutionId, userId, 'ATTENDANCE_CORRECTION_REQUESTED', sessionId, { requestId: request.id, studentId, old: request.oldStatus, new: newStatus });
  return request;
};

const listCorrectionRequests = ({ institutionId, status, requestedById, sessionId }) =>
  prisma.attendanceCorrectionRequest.findMany({
    where: {
      institutionId,
      ...(status && { status }),
      ...(requestedById && { requestedById }),
      ...(sessionId && { sessionId }),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
      session: {
        select: {
          id: true,
          date: true,
          periodNumber: true,
          section: { select: { name: true } },
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const reviewCorrectionRequest = async ({ requestId, institutionId, userId, decision, remarks }) => {
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new ValidationError('decision must be APPROVE or REJECT');
  const request = await prisma.attendanceCorrectionRequest.findFirst({ where: { id: requestId, institutionId } });
  if (!request) throw new NotFoundError('Correction request not found');
  if (request.status !== 'PENDING') throw new BusinessRuleError(`This request was already ${request.status.toLowerCase()}`);
  if (request.requestedById === userId) throw new BusinessRuleError('A correction must be reviewed by someone other than the requester');
  if (decision === 'REJECT' && !(remarks && String(remarks).trim())) throw new ValidationError('A reason is required when rejecting a correction');

  const reviewed = { reviewedById: userId, reviewedAt: new Date(), reviewRemarks: remarks ? String(remarks).trim() : null };

  if (decision === 'REJECT') {
    const updated = await prisma.attendanceCorrectionRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', ...reviewed } });
    await audit(institutionId, userId, 'ATTENDANCE_CORRECTION_REJECTED', request.sessionId, { requestId });
    return updated;
  }

  const { sessionId, studentId, newStatus } = request;
  const [updated] = await prisma.$transaction([
    prisma.attendanceCorrectionRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', ...reviewed } }),
    prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: { sessionId, studentId, status: newStatus, remarks: `Corrected: ${request.reason}` },
      update: { status: newStatus, remarks: `Corrected: ${request.reason}` },
    }),
  ]);
  await audit(institutionId, userId, 'ATTENDANCE_CORRECTION_APPLIED', sessionId, {
    requestId,
    studentId,
    old: request.oldStatus,
    new: newStatus,
  });
  return updated;
};

module.exports = {
  ATTENDED_STATUSES,
  ALL_STATUSES,
  isAttended,
  getLockDays,
  isDateLocked,
  assertDateEditable,
  createCorrectionRequest,
  listCorrectionRequests,
  reviewCorrectionRequest,
};
