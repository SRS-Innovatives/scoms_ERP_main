/**
 * Staff Assignment Management Controller
 *
 * Assignment.className is a plain string (not a real FK) — createAssignment resolves it
 * from the staff member's actual SubjectTeacherMapping via shared formatClassLabel, so
 * "target class" is always a real course+section the teacher is assigned to, and the
 * Student side can match against the exact same label deterministically.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  formatClassLabel,
} = require('../../../shared');

/** Subject+section combinations this staff member actually teaches — used to populate
 * the "target class" dropdown when creating an assignment. */
const getMyClasses = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId, sectionId: { not: null } },
      include: {
        subject: { select: { id: true, name: true } },
        section: { select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } } } },
      },
    });
    const classes = mappings.map((m) => ({
      subjectId: m.subjectId,
      subjectName: m.subject?.name,
      sectionId: m.sectionId,
      className: formatClassLabel(m.section?.semester?.course?.name, m.section?.name),
    }));
    return sendSuccess(res, classes, 'Assigned classes retrieved');
  } catch (err) {
    next(err);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const { title, description, subjectId, sectionId, dueDate, totalMarks, attachmentUrl } = req.body;
    if (!title || !subjectId || !sectionId || !dueDate) throw new ValidationError('title, subjectId, sectionId, dueDate are required');

    const mapping = await prisma.subjectTeacherMapping.findFirst({
      where: { staffId: req.user.staffId, subjectId, sectionId },
      include: { subject: true, section: { include: { semester: { include: { course: true } } } } },
    });
    if (!mapping) throw new ValidationError('You are not assigned to teach this subject/section');

    const assignment = await prisma.assignment.create({
      data: {
        institutionId: req.institutionId,
        staffId: req.user.staffId,
        title,
        description: description || '',
        subjectName: mapping.subject.name,
        className: formatClassLabel(mapping.section.semester.course.name, mapping.section.name),
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

const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findFirst({
      where: { id, institutionId: req.institutionId, staffId: req.user.staffId },
      include: { _count: { select: { submissions: true } } },
    });
    if (!assignment) throw new NotFoundError('Assignment not found or access denied');

    return sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findFirst({ where: { id, institutionId: req.institutionId, staffId: req.user.staffId } });
    if (!assignment) throw new NotFoundError('Assignment not found or access denied');

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
      orderBy: { submittedAt: 'desc' },
    });

    return sendSuccess(res, { assignment, submissions }, 'Submissions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const evaluateSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, feedback } = req.body;

    // Ownership check — the submission must belong to an assignment this staff member
    // created (and that assignment must belong to their own institution), never trust
    // a raw submissionId alone.
    const existing = await prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignment: { institutionId: req.institutionId, staffId: req.user.staffId } },
    });
    if (!existing) throw new NotFoundError('Submission not found or access denied');

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
  getMyClasses,
  createAssignment,
  getAssignments,
  getAssignmentById,
  getSubmissions,
  evaluateSubmission,
};
