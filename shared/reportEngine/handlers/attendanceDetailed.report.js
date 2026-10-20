const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');
const { isAttended } = require('../../attendance/attendanceRules');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** ATTENDANCE_DETAILED — every recorded session in a date range, one row per session.
 * Narrow to studentId for that one student's own day-by-day log instead — each row then
 * shows just their own status for that session, not the whole class's counts. */
module.exports = async (institutionId, filters) => {
  const { dateFrom, dateTo, sectionId, subjectId, studentId } = filters;
  if (!dateFrom || !dateTo) throw new ValidationError('dateFrom and dateTo are required');

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      institutionId,
      date: { gte: startOfDay(dateFrom), lte: endOfDay(dateTo) },
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
      ...(studentId && { records: { some: { studentId } } }),
    },
    include: {
      section: { select: { name: true, semester: { select: { course: { select: { name: true } } } } } },
      subject: { select: { name: true } },
      records: { select: { status: true, studentId: true } },
    },
    orderBy: { date: 'asc' },
  });

  const rows = sessions.map((s) => {
    const relevant = studentId ? s.records.filter((r) => r.studentId === studentId) : s.records;
    const present = relevant.filter((r) => isAttended(r.status)).length;
    const absent = relevant.filter((r) => r.status === 'ABSENT').length;
    const total = relevant.length;
    return {
      date: s.date.toISOString().slice(0, 10),
      class: `${s.section?.semester?.course?.name || ''} — ${s.section?.name || ''}`,
      subject: s.subject?.name || '—',
      period: s.periodNumber,
      present,
      absent,
      total,
      rate: total > 0 ? `${Math.round((present / total) * 100)}%` : '—',
    };
  });

  return { rows, summary: `${rows.length} session(s) found` };
};
