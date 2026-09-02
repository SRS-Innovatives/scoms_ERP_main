const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');

const computeGrade = (marksObtained, maxMarks) => {
  const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 75) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 45) return 'C';
  if (pct >= 35) return 'D';
  return 'F';
};

/** EXAM_RESULT — every published mark for a selected exam, one row per student per subject. */
module.exports = async (institutionId, filters) => {
  const { examId, sectionId } = filters;
  if (!examId) throw new ValidationError('examId is required');

  const marks = await prisma.studentMark.findMany({
    where: {
      examSchedule: { examId, exam: { institutionId } },
      ...(sectionId && { student: { sectionId } }),
    },
    include: {
      student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } },
      examSchedule: { select: { maxMarks: true, subject: { select: { name: true } } } },
    },
    orderBy: { student: { rollNumber: 'asc' } },
  });

  const rows = marks.map((m) => ({
    name: `${m.student.firstName} ${m.student.lastName}`,
    rollNumber: m.student.rollNumber,
    section: m.student.section?.name || '—',
    subject: m.examSchedule.subject?.name || '—',
    maxMarks: m.examSchedule.maxMarks,
    obtained: m.marksObtained,
    grade: m.grade || computeGrade(m.marksObtained, m.examSchedule.maxMarks),
  }));

  return { rows, summary: `${rows.length} result(s) found` };
};
