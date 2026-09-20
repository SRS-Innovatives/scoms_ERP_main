const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');
const { getGradeScale, resolveGrade } = require('../../utils/grading');

/** EXAM_RESULT — every recorded mark for a selected exam, one row per student per subject.
 * Grade uses the institution's real GradeScale (falling back to the same default curve
 * every other exam feature uses), and an absent student shows "AB" rather than being
 * silently scored as a fail. */
module.exports = async (institutionId, filters) => {
  const { examId, sectionId, studentId } = filters;
  if (!examId) throw new ValidationError('examId is required');

  const [marks, scale] = await Promise.all([
    prisma.studentMark.findMany({
      where: {
        examSchedule: { examId, exam: { institutionId } },
        // studentId narrows to one student's own per-subject results for this exam;
        // sectionId (whole-class) only applies when no specific student was picked.
        ...(studentId ? { studentId } : (sectionId && { student: { sectionId } })),
      },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } },
        examSchedule: { select: { maxMarks: true, subject: { select: { name: true } } } },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    }),
    getGradeScale(institutionId),
  ]);

  const rows = marks.map((m) => ({
    name: `${m.student.firstName} ${m.student.lastName}`,
    rollNumber: m.student.rollNumber,
    section: m.student.section?.name || '—',
    subject: m.examSchedule.subject?.name || '—',
    maxMarks: m.examSchedule.maxMarks,
    obtained: m.isAbsent ? '—' : m.marksObtained,
    grade: m.isAbsent ? 'AB' : (m.grade || resolveGrade(scale, m.marksObtained, m.examSchedule.maxMarks)),
  }));

  return { rows, summary: `${rows.length} result(s) found` };
};
