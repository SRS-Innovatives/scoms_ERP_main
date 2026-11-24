/**
 * Academic calendar range query, shared by the Student and Staff backends.
 *
 * ?from=&to= returns every event that OVERLAPS the range — including one that started
 * before `from` and is still running (endDate, or startDate for a single-day event, on or
 * after `from`). The old per-backend versions let `to` silently replace `from` when both
 * were sent, and dropped multi-day events that began before the range.
 */
const prisma = require('../database/client');
const { ValidationError } = require('../errors/customErrors');

const parseDate = (value, name) => {
  if (value === undefined || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ValidationError(`${name} must be a valid date`);
  return d;
};

/** Where-clause pieces for an overlap query (exported for tests). */
const rangeFilter = (from, to) => {
  const and = [];
  if (to) and.push({ startDate: { lte: to } });
  if (from) and.push({ OR: [{ endDate: { gte: from } }, { endDate: null, startDate: { gte: from } }] });
  return and;
};

const listCalendarEvents = async (institutionId, query = {}) => {
  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from && to && to < from) throw new ValidationError('to cannot be before from');
  const and = rangeFilter(from, to);
  return prisma.academicCalendarEvent.findMany({
    where: { institutionId, ...(and.length && { AND: and }) },
    orderBy: { startDate: 'asc' },
    select: { id: true, title: true, description: true, eventType: true, startDate: true, endDate: true },
  });
};

module.exports = { listCalendarEvents, rangeFilter };
