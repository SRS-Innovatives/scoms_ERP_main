const prisma = require('../../database/client');

const gradeFromPct = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 75) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 45) return 'C';
  if (pct >= 35) return 'D';
  return 'F';
};

/** STUDENT_PERFORMANCE — average marks % per student, across every exam recorded, optionally scoped to one section. */
module.exports = async (institutionId, filters) => {
  const { sectionId, courseId } = filters;

  const students = await prisma.student.findMany({
    where: {
      institutionId,
      status: 'ACTIVE',
      ...(sectionId && { sectionId }),
      ...(courseId && { courseId }),
    },
    select: {
      id: true, firstName: true, lastName: true, rollNumber: true,
      section: { select: { name: true } },
      studentMarks: { select: { marksObtained: true, examSchedule: { select: { maxMarks: true } } } },
    },
    orderBy: { rollNumber: 'asc' },
  });

  const rows = students.map((s) => {
    if (s.studentMarks.length === 0) {
      return { name: `${s.firstName} ${s.lastName}`, rollNumber: s.rollNumber, section: s.section?.name || '—', avgPercent: '—', grade: '—', examsCount: 0 };
    }
    const totalPct = s.studentMarks.reduce((sum, m) => sum + (m.marksObtained / m.examSchedule.maxMarks) * 100, 0);
    const avgPct = totalPct / s.studentMarks.length;
    return {
      name: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber,
      section: s.section?.name || '—',
      avgPercent: `${avgPct.toFixed(1)}%`,
      grade: gradeFromPct(avgPct),
      examsCount: s.studentMarks.length,
    };
  });

  return { rows, summary: `${rows.length} student(s) found` };
};
