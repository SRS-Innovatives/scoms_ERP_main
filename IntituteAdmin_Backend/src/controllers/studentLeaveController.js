/**
 * Institute Admin — Student Leave Requests
 *
 * Every student leave request in the institution, in one place. The student's class
 * teacher decides these day to day (Staff portal → Student Leave Approvals); the
 * Institute Admin sees all of them and can also approve or reject as the institution-
 * level authority (e.g. when a class has no class teacher assigned, or one is away).
 * Both sides are notified in-app when a request is created (Student_Backend) and the
 * student is notified of the decision.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, findList, pushNotification } = require('../../../shared');
const { hasValue } = require('../../../shared/media/mediaUrl');

const VALID_DECISIONS = ['APPROVED', 'REJECTED'];
const VALID_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

/** GET /student-leave?status=PENDING&sectionId=… (also ?page=&limit=, see findList) */
const getStudentLeaves = async (req, res, next) => {
  try {
    const { status, sectionId } = req.query;
    if (status && !VALID_FILTERS.includes(status)) throw new ValidationError(`status must be one of ${VALID_FILTERS.join(', ')}`);

    const { rows: leaves, meta } = await findList(prisma.leaveRequest, {
      where: {
        institutionId: req.institutionId,
        studentId: { not: null },
        ...(status && { status }),
        ...(sectionId && { student: { sectionId } }),
      },
      // the attachment file isn't shown in the list — hasAttachment says whether there is one
      omit: { attachmentUrl: true },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            admissionNumber: true,
            section: {
              select: {
                id: true,
                name: true,
                semester: { select: { course: { select: { name: true } } } },
                classTeacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }, req);

    const withAttachment = await hasValue(prisma, 'LeaveRequest', 'attachmentUrl', leaves.map((l) => l.id));
    const rows = leaves.map((l) => {
      const section = l.student?.section;
      const teacher = section?.classTeacher;
      return {
        ...l,
        hasAttachment: withAttachment.get(l.id) || false,
        className: [section?.semester?.course?.name, section?.name].filter(Boolean).join(' - ') || null,
        classTeacherName: teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : null,
      };
    });
    return sendSuccess(res, rows, 'Student leave requests retrieved successfully', 200, meta);
  } catch (err) {
    next(err);
  }
};

/** PATCH /student-leave/:id  { status: APPROVED | REJECTED } */
const updateStudentLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_DECISIONS.includes(status)) throw new ValidationError(`status must be one of ${VALID_DECISIONS.join(', ')}`);

    const leave = await prisma.leaveRequest.findFirst({
      where: { id, institutionId: req.institutionId, studentId: { not: null } },
      select: { id: true, startDate: true, endDate: true, student: { select: { userId: true } } },
    });
    if (!leave) throw new NotFoundError('Leave request not found or access denied');

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: req.user.email },
      omit: { attachmentUrl: true },
    });

    // Let the student know the decision (best-effort — never blocks the decision itself)
    pushNotification({
      userId: leave.student?.userId,
      institutionId: req.institutionId,
      title: `Leave ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: `Your leave request for ${new Date(leave.startDate).toLocaleDateString('en-IN')} – ${new Date(leave.endDate).toLocaleDateString('en-IN')} was ${status.toLowerCase()} by the institution office.`,
      type: 'LEAVE',
      link: '/student/leave',
    }).catch(() => {});

    return sendSuccess(res, updated, `Leave request ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudentLeaves, updateStudentLeaveStatus };
