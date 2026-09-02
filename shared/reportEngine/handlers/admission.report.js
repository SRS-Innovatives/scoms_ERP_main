const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** ADMISSION_REPORT — every student admitted in a date range, optionally scoped to one course. */
module.exports = async (institutionId, filters) => {
  const { dateFrom, dateTo, courseId } = filters;
  if (!dateFrom || !dateTo) throw new ValidationError('dateFrom and dateTo are required');

  const students = await prisma.student.findMany({
    where: {
      institutionId,
      admissionDate: { gte: startOfDay(dateFrom), lte: endOfDay(dateTo) },
      ...(courseId && { courseId }),
    },
    include: {
      course: { select: { name: true } },
      section: { select: { name: true } },
    },
    orderBy: { admissionDate: 'asc' },
  });

  const rows = students.map((s) => ({
    admissionDate: s.admissionDate.toISOString().slice(0, 10),
    admissionNumber: s.admissionNumber,
    name: `${s.firstName} ${s.lastName}`,
    course: s.course?.name || '—',
    section: s.section?.name || '—',
    status: s.status,
  }));

  return { rows, summary: `${rows.length} admission(s) found` };
};
