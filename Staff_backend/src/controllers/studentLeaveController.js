/**
 * Staff — Student Leave Approval Controller
 *
 * The CLASS TEACHER of a section decides its students' leave (Principal/VP: any section,
 * HOD: their department). A subject teacher of that section sees the requests, read-only.
 * Rules live in shared/academic/teachingScope.js.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, AuthorizationError, teachingScope } = require('../../../shared');

const VALID_STATUSES = ['APPROVED', 'REJECTED'];

const getStudentLeaves = async (req, res, next) => {
  try {
    const [decideSectionIds, scope] = await Promise.all([
      teachingScope.getLeaveApprovalSectionIds(req.user, req.institutionId),
      teachingScope.getStaffScope(req.user, req.institutionId),
    ]);
    const teachSectionIds = scope.assignments.map((a) => a.sectionId).filter(Boolean);
    const visibleSectionIds = [...new Set([...decideSectionIds, ...teachSectionIds])];
    if (visibleSectionIds.length === 0) return sendSuccess(res, [], 'Student leave requests retrieved');

    const leaves = await prisma.leaveRequest.findMany({
      where: { institutionId: req.institutionId, studentId: { not: null }, student: { sectionId: { in: visibleSectionIds } } },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, sectionId: true, section: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    // canDecide: true only where this staff member is the deciding authority
    const withRights = leaves.map((l) => ({ ...l, canDecide: decideSectionIds.includes(l.student?.sectionId) }));
    return sendSuccess(res, withRights, 'Student leave requests retrieved');
  } catch (err) {
    next(err);
  }
};

const updateStudentLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const leave = await prisma.leaveRequest.findFirst({
      where: { id, institutionId: req.institutionId, studentId: { not: null } },
      select: { id: true, student: { select: { sectionId: true } } },
    });
    if (!leave) throw new NotFoundError('Leave request not found or access denied');
    const sectionIds = await teachingScope.getLeaveApprovalSectionIds(req.user, req.institutionId);
    if (!sectionIds.includes(leave.student?.sectionId)) {
      throw new AuthorizationError("Only the student's class teacher can approve or reject this leave");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: req.user.email },
    });

    return sendSuccess(res, updated, `Leave request ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudentLeaves, updateStudentLeaveStatus };
