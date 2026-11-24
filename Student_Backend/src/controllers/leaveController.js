/**
 * Student — Leave / Absence Requests Controller
 */
const { prisma, sendSuccess, ValidationError, getActiveList, pushNotificationToMany, ROLES } = require('../../../shared');
const { hasValue } = require('../../../shared/media/mediaUrl');

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** New student leave → in-app notification to everyone who may decide it, each linked to
 * their own approval page (who decides: shared/academic/teachingScope.js):
 *   - the student's class teacher                         → Staff portal
 *   - every active Principal / Vice Principal              → Staff portal (all sections)
 *   - the HOD of the class's department                   → Staff portal (their department)
 *   - every active Institute Admin                         → Admin portal
 * Nobody is notified twice (e.g. a class teacher who is also the HOD). */
const notifyLeaveApprovers = async (institutionId, studentId, leave) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      firstName: true,
      lastName: true,
      rollNumber: true,
      section: { select: { name: true, semester: { select: { course: { select: { name: true, departmentId: true } } } }, classTeacher: { select: { userId: true } } } },
    },
  });
  if (!student) return;
  const className = [student.section?.semester?.course?.name, student.section?.name].filter(Boolean).join(' - ');
  const days = leave.startDate.getTime() === leave.endDate.getTime() ? fmt(leave.startDate) : `${fmt(leave.startDate)} – ${fmt(leave.endDate)}`;
  const title = 'New Student Leave Request';
  const message = `${student.firstName} ${student.lastName}${className ? ` (${className}${student.rollNumber ? `, Roll ${student.rollNumber}` : ''})` : ''} applied for ${String(leave.type || 'casual').toLowerCase()} leave on ${days}: ${leave.reason}`;

  const classTeacherUserId = student.section?.classTeacher?.userId;
  const departmentId = student.section?.semester?.course?.departmentId;
  const [admins, seniorStaff] = await Promise.all([
    prisma.user.findMany({
      where: { institutionId, role: ROLES.INSTITUTE_ADMIN, status: 'ACTIVE' },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: {
        institutionId,
        status: 'ACTIVE',
        OR: [
          { role: { in: [ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL] } },
          ...(departmentId ? [{ role: ROLES.HOD, staff: { departmentId } }] : []),
        ],
      },
      select: { id: true },
    }),
  ]);

  const staffPortalIds = [...new Set([classTeacherUserId, ...seniorStaff.map((u) => u.id)].filter(Boolean))];
  const adminIds = admins.map((a) => a.id).filter((id) => !staffPortalIds.includes(id));
  await Promise.all([
    staffPortalIds.length && pushNotificationToMany({ userIds: staffPortalIds, institutionId, title, message, type: 'LEAVE', link: '/staff/leave/student-approvals' }),
    adminIds.length && pushNotificationToMany({ userIds: adminIds, institutionId, title, message, type: 'LEAVE', link: '/admin/student/leave' }),
  ]);
};

/** The leave types this institution actually offers right now — its own customized
 * list if it has one, the standard default otherwise. Powers the Apply Leave dropdown. */
const getLeaveTypes = async (req, res, next) => {
  try {
    const types = await getActiveList(req.institutionId, 'LEAVE_TYPE');
    return sendSuccess(res, types, 'Leave types retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    // attachments aren't shown in the list — say whether there is one instead of sending every file
    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: req.user.studentId },
      omit: { attachmentUrl: true },
      orderBy: { createdAt: 'desc' },
    });
    const withAttachment = await hasValue(prisma, 'LeaveRequest', 'attachmentUrl', leaves.map((l) => l.id));
    leaves.forEach((l) => { l.hasAttachment = withAttachment.get(l.id) || false; });
    return sendSuccess(res, leaves, 'Leave requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason || !String(reason).trim()) throw new ValidationError('startDate, endDate and reason are required');
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ValidationError('startDate and endDate must be valid dates');
    if (end < start) throw new ValidationError('endDate cannot be before startDate');
    if (String(reason).length > 1000) throw new ValidationError('reason is too long (max 1000 characters)');
    // Only the institution's own leave types (Settings → Custom Lists, or the defaults)
    const allowedTypes = (await getActiveList(req.institutionId, 'LEAVE_TYPE')).map((t) => t.code);
    const leaveType = type || (allowedTypes.includes('CASUAL') ? 'CASUAL' : allowedTypes[0]);
    if (!allowedTypes.includes(leaveType)) throw new ValidationError(`Unknown leave type "${leaveType}"`);

    const leave = await prisma.leaveRequest.create({
      data: {
        institutionId: req.institutionId,
        studentId: req.user.studentId,
        type: leaveType,
        startDate: start,
        endDate: end,
        reason: String(reason).trim(),
      },
    });

    // Tell the people who decide it: the class teacher (Staff portal → Student Leave
    // Approvals) and the Institute Admin(s) (Admin portal → Student Leave Requests).
    // Best-effort — never blocks or fails the leave request itself.
    notifyLeaveApprovers(req.institutionId, req.user.studentId, leave).catch(() => {});

    return sendSuccess(res, leave, 'Leave request submitted for approval', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyLeaves, applyLeave, getLeaveTypes };
