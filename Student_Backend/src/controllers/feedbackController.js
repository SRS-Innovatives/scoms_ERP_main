/**
 * Student — Anonymous Course/Faculty Feedback Controller
 *
 * True anonymity: this controller never returns studentId anywhere — only whether the
 * calling student has already submitted feedback for a subject (so the UI can disable
 * the form), never the content or identity tied to any other student's submission.
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

/** Subjects for the student's own course, each flagged with whether feedback was already given. */
const getFeedbackSubjects = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Subjects retrieved');

    const subjects = await prisma.subject.findMany({
      where: { classMappings: { some: { courseId: student.courseId } } },
      select: {
        id: true,
        name: true,
        courseFeedback: { where: { studentId: req.user.studentId }, select: { rating: true } },
      },
      orderBy: { name: 'asc' },
    });

    const withStatus = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      alreadySubmitted: s.courseFeedback.length > 0,
      myRating: s.courseFeedback[0]?.rating ?? null,
    }));

    return sendSuccess(res, withStatus, 'Subjects retrieved');
  } catch (err) {
    next(err);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { subjectId, rating, comments } = req.body;
    if (!subjectId || !rating) throw new ValidationError('subjectId and rating are required');
    if (rating < 1 || rating > 5) throw new ValidationError('rating must be between 1 and 5');

    const existing = await prisma.courseFeedback.findUnique({
      where: { studentId_subjectId: { studentId: req.user.studentId, subjectId } },
    });
    if (existing) throw new ValidationError('Feedback already submitted for this subject');

    await prisma.courseFeedback.create({
      data: { studentId: req.user.studentId, subjectId, rating: Number(rating), comments },
    });

    // Never return the created row — reinforces that nothing identity-linked comes back.
    return sendSuccess(res, null, 'Anonymous feedback submitted. Thank you!', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeedbackSubjects, submitFeedback };
