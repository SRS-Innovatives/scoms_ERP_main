/**
 * Student — Attendance correction requests (Attendance page → "Request correction")
 *
 * A student (or their parent) asks for a wrong mark to be fixed — "I was present", "I was on
 * official duty". It goes into the same AttendanceCorrectionRequest queue staff corrections use
 * (shared/attendance/attendanceRules.js), so the existing approvers — Principal / Vice Principal
 * / HOD / Institute Admin under Attendance → Correction Approvals — decide it, and on approval
 * the record is changed with the reason kept as the audit trail. The student is told the outcome.
 *
 * Limits: only the student's own record, only a mark that isn't already what they ask for, only
 * within the last REQUEST_WINDOW_DAYS days, one pending request per class session.
 */
const { prisma, sendSuccess, ValidationError, NotFoundError, attendanceRules, pushNotificationToMany, logger } = require('../../../shared');
const { hasPermissionAsync } = require('../../../shared/permissions/permissionMatrix');
const { cachedPermissionClient } = require('../../../shared/utils/hotCache');

const REQUEST_WINDOW_DAYS = 30;
const ASKABLE = ['PRESENT', 'ON_DUTY', 'LATE'];
const APPROVER_ROLES = ['INSTITUTE_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'];

const getMyCorrections = async (req, res, next) => {
  try {
    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where: { institutionId: req.institutionId, studentId: req.user.studentId },
      select: {
        id: true, sessionId: true, oldStatus: true, newStatus: true, reason: true, status: true, reviewRemarks: true, reviewedAt: true, createdAt: true,
        session: { select: { date: true, periodNumber: true, subject: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return sendSuccess(res, requests, 'Correction requests retrieved');
  } catch (err) {
    next(err);
  }
};

const requestCorrection = async (req, res, next) => {
  try {
    const { sessionId, newStatus, reason } = req.body || {};
    if (!sessionId) throw new ValidationError('sessionId is required');
    if (!ASKABLE.includes(newStatus)) throw new ValidationError(`You can ask to be marked ${ASKABLE.join(', ')}`);
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 5) throw new ValidationError('Please explain the reason (at least a few words)');
    if (cleanReason.length > 500) throw new ValidationError('Reason is too long (max 500 characters)');

    const record = await prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId, studentId: req.user.studentId } },
      select: { status: true, session: { select: { date: true, institutionId: true, sectionId: true, subject: { select: { name: true } }, section: { select: { name: true, classTeacher: { select: { userId: true } } } } } } },
    });
    if (!record || record.session.institutionId !== req.institutionId) throw new NotFoundError('Attendance record not found');
    if (record.status === newStatus) throw new ValidationError(`You are already marked ${newStatus.replace('_', ' ').toLowerCase()} for this class`);
    if (Date.now() - new Date(record.session.date).getTime() > REQUEST_WINDOW_DAYS * 86400000) {
      throw new ValidationError(`Corrections can only be requested within ${REQUEST_WINDOW_DAYS} days — please contact your class teacher`);
    }

    // same checks + audit as a staff correction (student in the class, one pending per session)
    const request = await attendanceRules.createCorrectionRequest({
      sessionId,
      institutionId: req.institutionId,
      userId: req.user.id,
      studentId: req.user.studentId,
      newStatus,
      reason: cleanReason,
    });

    // tell the people who can decide it (+ the class teacher, who usually knows)
    (async () => {
      const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { firstName: true, lastName: true, rollNumber: true } });
      const roles = [];
      for (const r of APPROVER_ROLES) if (await hasPermissionAsync(cachedPermissionClient, r, 'attendance.approve')) roles.push(r);
      const approvers = await prisma.user.findMany({ where: { institutionId: req.institutionId, role: { in: roles }, status: 'ACTIVE' }, select: { id: true, role: true } });
      const admins = approvers.filter((u) => u.role === 'INSTITUTE_ADMIN').map((u) => u.id);
      const staffIds = [...new Set([...approvers.filter((u) => u.role !== 'INSTITUTE_ADMIN').map((u) => u.id), record.session.section?.classTeacher?.userId].filter((id) => id && !admins.includes(id)))];
      const day = new Date(record.session.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      const note = {
        institutionId: req.institutionId,
        type: 'ATTENDANCE',
        title: 'Attendance Correction Requested',
        message: `${student.firstName} ${student.lastName}${student.rollNumber ? ` (${student.rollNumber})` : ''}, ${record.session.section?.name || ''}: ${day}${record.session.subject?.name ? ` ${record.session.subject.name}` : ''} — marked ${String(record.status).toLowerCase()}, asks for ${newStatus.replace('_', ' ').toLowerCase()}. "${cleanReason.slice(0, 120)}"`,
      };
      // each opens the approvals page of their own portal
      await Promise.all([
        admins.length && pushNotificationToMany({ ...note, userIds: admins, link: '/admin/attendance/corrections' }),
        staffIds.length && pushNotificationToMany({ ...note, userIds: staffIds, link: '/staff/attendance/corrections' }),
      ]);
    })().catch((e) => logger.error('Correction request notification failed:', e));

    return sendSuccess(res, request, 'Correction request sent for approval', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyCorrections, requestCorrection, REQUEST_WINDOW_DAYS };
