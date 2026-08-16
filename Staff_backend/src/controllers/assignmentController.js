/**
 * Staff Assignment Management Controller
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
} = require('../../../shared');

const createAssignment = async (req, res, next) => {
  try {
    const { title, description, subjectName, className, dueDate, totalMarks, attachmentUrl } = req.body;

    const assignment = await prisma.assignment.create({
      data: {
        institutionId: req.institutionId,
        staffId: req.user.staffId,
        title,
        description,
        subjectName,
        className,
        dueDate: new Date(dueDate),
        totalMarks: Number(totalMarks) || 100,
        attachmentUrl,
      },
    });

    return sendSuccess(res, assignment, 'Assignment created and published successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        institutionId: req.institutionId,
        staffId: req.user.staffId,
      },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, assignments, 'Assignments retrieved');
  } catch (err) {
    next(err);
  }
};

const evaluateSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, feedback } = req.body;

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksObtained: Number(marksObtained),
        feedback,
        status: 'REVIEWED',
      },
    });

    return sendSuccess(res, submission, 'Assignment submission evaluated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  evaluateSubmission,
};
