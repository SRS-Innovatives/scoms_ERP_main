/**
 * Staff — Student Leave Approval Controller
 *
 * A staff member acts as approver only for students in a section they actually teach
 * (via SubjectTeacherMapping), never for the whole institution.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_STATUSES = ['APPROVED', 'REJECTED'];

const getMySectionIds = async (staffId) => {
  const mappings = await prisma.subjectTeacherMapping.findMany({
    where: { staffId, sectionId: { not: null } },
    select: { sectionId: true },
    distinct: ['sectionId'],
  });
  return mappings.map((m) => m.sectionId);
};

const getStudentLeaves = async (req, res, next) => {
  try {
    const sectionIds = await getMySectionIds(req.user.staffId);
    if (sectionIds.length === 0) return sendSuccess(res, [], 'Student leave requests retrieved');

    const leaves = await prisma.leaveRequest.findMany({
      where: { institutionId: req.institutionId, studentId: { not: null }, student: { sectionId: { in: sectionIds } } },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, leaves, 'Student leave requests retrieved');
  } catch (err) {
    next(err);
  }
};

const updateStudentLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const sectionIds = await getMySectionIds(req.user.staffId);
    const leave = await prisma.leaveRequest.findFirst({
      where: { id, institutionId: req.institutionId, studentId: { not: null }, student: { sectionId: { in: sectionIds } } },
    });
    if (!leave) throw new NotFoundError('Leave request not found or access denied');

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
