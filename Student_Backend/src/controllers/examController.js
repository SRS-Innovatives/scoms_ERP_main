/**
 * Student Examination Controller — read-only.
 *
 * A student sees exam schedules for subjects in their own course, and results only
 * once the Institute Admin has explicitly published that exam schedule.
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

const getExamSchedule = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student) throw new NotFoundError('Student profile not found');
    // A student admitted straight into a section without a course set (common for
    // school-type institutions, where "course" isn't really a concept) has no
    // courseId to filter by — same graceful empty-list fallback used by getMySubjects,
    // rather than crashing on a null-vs-relation-filter ambiguity in Prisma.
    if (!student.courseId) return sendSuccess(res, [], 'Exam schedule retrieved successfully');

    const schedules = await prisma.examSchedule.findMany({
      // The exam schedule's own courseId is the real authority now — a subject can be
      // mapped to several classes, so this must never be inferred through the subject.
      where: { courseId: student.courseId, exam: { institutionId: req.institutionId } },
      include: {
        subject: { select: { name: true, code: true } },
        exam: { select: { name: true, examType: true, status: true } },
      },
      orderBy: { examDate: 'asc' },
    });

    return sendSuccess(res, schedules, 'Exam schedule retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getResults = async (req, res, next) => {
  try {
    const marks = await prisma.studentMark.findMany({
      where: { studentId: req.user.studentId, examSchedule: { isPublished: true } },
      include: {
        examSchedule: {
          select: {
            maxMarks: true,
            passMarks: true,
            publishedAt: true,
            subject: { select: { name: true, code: true } },
            exam: { select: { name: true, examType: true } },
          },
        },
      },
      orderBy: { examSchedule: { examDate: 'desc' } },
    });

    return sendSuccess(res, marks, 'Results retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExamSchedule,
  getResults,
};
