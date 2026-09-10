/**
 * Student Assignment Controller
 *
 * Assignment.className is a plain string (matches shared/utils/classLabel's format) —
 * "my assignments" resolves the student's own course+section into that exact label and
 * matches on it, so a student only ever sees assignments actually targeted at their class.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, formatClassLabel, pushNotification } = require('../../../shared');

const getMyAssignments = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: { course: { select: { name: true } }, section: { select: { name: true } } },
    });
    if (!student?.course || !student?.section) {
      return sendSuccess(res, [], 'Assignments retrieved successfully');
    }

    const className = formatClassLabel(student.course.name, student.section.name);

    const assignments = await prisma.assignment.findMany({
      where: { institutionId: req.institutionId, className, status: 'PUBLISHED' },
      include: {
        staff: { select: { firstName: true, lastName: true } },
        submissions: { where: { studentId: req.user.studentId } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const withMySubmission = assignments.map((a) => ({ ...a, mySubmission: a.submissions[0] || null, submissions: undefined }));
    return sendSuccess(res, withMySubmission, 'Assignments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId, content, fileUrl } = req.body;
    if (!assignmentId || (!content && !fileUrl)) throw new ValidationError('assignmentId and content or fileUrl are required');

    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: { course: { select: { name: true } }, section: { select: { name: true } } },
    });
    const className = student?.course && student?.section ? formatClassLabel(student.course.name, student.section.name) : null;

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, institutionId: req.institutionId, className: className || undefined },
      include: { staff: { select: { userId: true } } },
    });
    if (!assignment) throw new NotFoundError('Assignment not found or not assigned to your class');

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: req.user.studentId } },
      create: { assignmentId, studentId: req.user.studentId, content, fileUrl, status: isLate ? 'LATE' : 'SUBMITTED' },
      update: { content, fileUrl, submittedAt: new Date(), status: isLate ? 'LATE' : 'SUBMITTED' },
    });

    if (assignment.staff?.userId) {
      pushNotification({
        userId: assignment.staff.userId,
        institutionId: req.institutionId,
        title: 'Homework Submission Received',
        message: `${student?.firstName || 'A student'} ${student?.lastName || ''} submitted "${assignment.title}"${isLate ? ' (late)' : ''}.`,
        type: 'HOMEWORK',
        link: `/staff/assignments/details?id=${assignment.id}`,
      }).catch(() => {});
    }

    return sendSuccess(res, submission, 'Homework submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyAssignments,
  submitAssignment,
};
