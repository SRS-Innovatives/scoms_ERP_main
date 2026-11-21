/**
 * Student — Question Bank Controller (read-only practice material)
 *
 * Scoped by the student's own course via SubjectClassMapping — a subject can be mapped
 * to several classes, so "does this subject apply to my class" is answered by that
 * mapping, not by any single field on Subject itself.
 */
const { prisma, sendSuccess } = require('../../../shared');
const { studentSubjectWhere } = require('../../../shared/academic/electives');

const getQuestions = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Question bank retrieved');

    const questions = await prisma.questionBank.findMany({
      where: { institutionId: req.institutionId, subject: studentSubjectWhere({ id: req.user.studentId, courseId: student.courseId }) /* core subjects + this student's electives */ },
      include: { subject: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, questions, 'Question bank retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getQuestions };
