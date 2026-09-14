const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');

/** RANK_LIST — one row per student, total marks/percentage across every subject scheduled
 * under a selected exam, ranked highest to lowest. An absence never counts toward or
 * against the total, matching the same rule used in the live Rank List & Analysis screen.
 * Optionally narrowed to one section — the whole-class view is the default (no section = every
 * student who sat this exam). */
module.exports = async (institutionId, filters) => {
  const { examId, sectionId } = filters;
  if (!examId) throw new ValidationError('examId is required');

  const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId } });
  if (!exam) throw new ValidationError('Exam not found');

  const marks = await prisma.studentMark.findMany({
    where: {
      examSchedule: { examId },
      ...(sectionId && { student: { sectionId } }),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } },
      examSchedule: { select: { maxMarks: true } },
    },
  });

  const byStudent = {};
  marks.forEach((m) => {
    if (!byStudent[m.studentId]) byStudent[m.studentId] = { student: m.student, total: 0, maxTotal: 0 };
    if (!m.isAbsent) {
      byStudent[m.studentId].total += m.marksObtained;
      byStudent[m.studentId].maxTotal += m.examSchedule.maxMarks;
    }
  });

  const ranked = Object.values(byStudent)
    .map((r) => ({ ...r, percentage: r.maxTotal > 0 ? Number(((r.total / r.maxTotal) * 100).toFixed(2)) : 0 }))
    .sort((a, b) => b.percentage - a.percentage);

  const rows = ranked.map((r, idx) => ({
    rank: idx + 1,
    name: `${r.student.firstName} ${r.student.lastName}`,
    rollNumber: r.student.rollNumber,
    section: r.student.section?.name || '—',
    totalMarks: r.total,
    totalMaxMarks: r.maxTotal,
    percentage: r.percentage,
  }));

  return { rows, summary: `${rows.length} student(s) ranked for "${exam.name}"` };
};
