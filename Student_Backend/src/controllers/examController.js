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

    const schedules = await prisma.examSchedule.findMany({
      where: { subject: { courseId: student.courseId }, exam: { institutionId: req.institutionId } },
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
