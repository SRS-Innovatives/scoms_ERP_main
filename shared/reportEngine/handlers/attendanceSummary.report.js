const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');
const { isAttended } = require('../../attendance/attendanceRules');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** ATTENDANCE_SUMMARY — attendance rate over a date range, aggregated per section by
 * default. Narrow to studentId for a single student's own summary instead — the rows
 * then become "how did THIS student do in each of their sections" (normally just one),
 * same shape either way. */
module.exports = async (institutionId, filters) => {
  const { dateFrom, dateTo, sectionId, studentId } = filters;
  if (!dateFrom || !dateTo) throw new ValidationError('dateFrom and dateTo are required');

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      institutionId,
      date: { gte: startOfDay(dateFrom), lte: endOfDay(dateTo) },
      ...(sectionId && { sectionId }),
      ...(studentId && { records: { some: { studentId } } }),
    },
    include: {
      section: { select: { name: true, semester: { select: { course: { select: { name: true } } } } } },
      records: { select: { status: true, studentId: true } },
    },
  });

  const bySection = {};
  sessions.forEach((s) => {
    const key = s.sectionId;
    if (!bySection[key]) {
      bySection[key] = {
        section: `${s.section?.semester?.course?.name || ''} — ${s.section?.name || ''}`,
        sessions: 0,
        present: 0,
        absent: 0,
        total: 0,
      };
    }
    bySection[key].sessions += 1;
    // When scoped to one student, only that student's own record in this session counts.
    const relevant = studentId ? s.records.filter((r) => r.studentId === studentId) : s.records;
    relevant.forEach((r) => {
      bySection[key].total += 1;
      if (isAttended(r.status)) bySection[key].present += 1;
      else if (r.status === 'ABSENT') bySection[key].absent += 1;
    });
  });

  const rows = Object.values(bySection).map((s) => ({
    section: s.section,
    sessions: s.sessions,
    present: s.present,
    absent: s.absent,
    total: s.total,
    rate: s.total > 0 ? `${Math.round((s.present / s.total) * 100)}%` : '—',
  }));

  return { rows, summary: `${rows.length} section(s), ${sessions.length} session(s) found` };
};
