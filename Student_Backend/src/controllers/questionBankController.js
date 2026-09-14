/**
 * Student — Question Bank Controller (read-only practice material)
 *
 * Scoped by the student's own course via SubjectClassMapping — a subject can be mapped
 * to several classes, so "does this subject apply to my class" is answered by that
 * mapping, not by any single field on Subject itself.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getQuestions = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Question bank retrieved');

    const questions = await prisma.questionBank.findMany({
      where: { institutionId: req.institutionId, subject: { classMappings: { some: { courseId: student.courseId } } } },
      include: { subject: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, questions, 'Question bank retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getQuestions };
