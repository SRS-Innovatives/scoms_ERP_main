/**
 * Timetable rules shared by IntituteAdmin_Backend and Staff_backend.
 *
 * Clashes: a teacher or room may only be booked once per (dayOfWeek, period) across all
 * sections of an institution. Rooms match on roomId, or on the normalised free-text
 * roomNumber when no roomId is set.
 *
 * Substitutes: a staff member asks for cover on one dated occurrence of their weekly
 * TimetableEntry; someone other than the requester approves it and picks a free teacher.
 * The weekly grid is never modified.
 */
const prisma = require('../database/client');
const { NotFoundError, BusinessRuleError, ValidationError } = require('../errors/customErrors');
const logger = require('../utils/logger');

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const JS_DAYS = ['SUNDAY', ...DAYS];

const roomKey = (e) => {
  if (e.roomId) return `id:${e.roomId}`;
  const n = (e.roomNumber || '').trim().toLowerCase();
  return n ? `no:${n}` : null;
};

/** Clashes between the proposed entries of one timetable and every other timetable in the institution. */
const findConflicts = async ({ institutionId, timetableId, entries, db = prisma }) => {
  const others = await db.timetableEntry.findMany({
    where: { timetable: { institutionId, id: { not: timetableId } } },
    select: {
      dayOfWeek: true,
      period: true,
      staffId: true,
      roomId: true,
      roomNumber: true,
      timetable: { select: { section: { select: { name: true, semester: { select: { course: { select: { name: true } } } } } } } },
    },
  });
  const bySlot = new Map();
  for (const o of others) {
    const k = `${o.dayOfWeek}_${o.period}`;
    if (!bySlot.has(k)) bySlot.set(k, []);
    bySlot.get(k).push(o);
  }
  const sectionName = (o) => {
    const s = o.timetable?.section;
    return [s?.semester?.course?.name, s?.name].filter(Boolean).join(' - ');
  };

  const conflicts = [];
  for (const e of entries) {
    const slot = bySlot.get(`${e.dayOfWeek}_${Number(e.period)}`) || [];
    const rk = roomKey(e);
    for (const o of slot) {
      if (e.staffId && o.staffId === e.staffId) {
        conflicts.push({ type: 'TEACHER', dayOfWeek: e.dayOfWeek, period: Number(e.period), staffId: e.staffId, otherSection: sectionName(o) });
      }
      if (rk && roomKey(o) === rk) {
        conflicts.push({ type: 'ROOM', dayOfWeek: e.dayOfWeek, period: Number(e.period), room: e.roomNumber || o.roomNumber || e.roomId, otherSection: sectionName(o) });
      }
    }
  }
  return conflicts;
};

const toDateOnly = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ValidationError('A valid date is required');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const dayOfWeekOf = (date) => JS_DAYS[date.getUTCDay()];

const audit = (institutionId, userId, action, entityId, details) =>
  prisma.auditLog
    .create({
      data: {
        institutionId,
        userId,
        action,
        module: 'TIMETABLE',
        entity: 'SubstituteRequest',
        entityId,
        ...(details && { newValues: JSON.stringify(details) }),
      },
    })
    .catch((err) => logger.warn('[TimetableRules] audit log write failed', { error: err.message }));

const requestInclude = {
  entry: {
    select: {
      id: true,
      dayOfWeek: true,
      period: true,
      startTime: true,
      endTime: true,
      roomNumber: true,
      subject: { select: { name: true, code: true } },
      timetable: { select: { section: { select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } } } } } },
    },
  },
  originalStaff: { select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true } },
  substituteStaff: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
};

const createSubstituteRequest = async ({ institutionId, userId, staffId, timetableEntryId, date, reason }) => {
  if (!(reason && String(reason).trim())) throw new ValidationError('A reason is required for a substitute request');
  const entry = await prisma.timetableEntry.findFirst({ where: { id: timetableEntryId, timetable: { institutionId } } });
  if (!entry) throw new NotFoundError('Timetable slot not found');
  if (entry.staffId !== staffId) throw new BusinessRuleError('You can only request cover for your own classes');

  const day = toDateOnly(date);
  if (dayOfWeekOf(day) !== entry.dayOfWeek) throw new ValidationError(`That date is not a ${entry.dayOfWeek.toLowerCase()}`);
  const today = toDateOnly(new Date());
  if (day < today) throw new ValidationError('Cover can only be requested for today or a future date');

  const active = await prisma.substituteRequest.findFirst({
    where: { timetableEntryId, date: day, status: { in: ['PENDING', 'APPROVED'] } },
  });
  if (active) throw new BusinessRuleError('Cover for this class on that date has already been requested');

  const request = await prisma.substituteRequest.create({
    data: { institutionId, timetableEntryId, date: day, originalStaffId: staffId, requestedById: userId, reason: String(reason).trim() },
    include: requestInclude,
  });
  await audit(institutionId, userId, 'SUBSTITUTE_REQUESTED', request.id, { timetableEntryId, date: day });
  return request;
};

const listSubstituteRequests = ({ institutionId, status, originalStaffId, substituteStaffId, departmentId, from }) =>
  prisma.substituteRequest.findMany({
    where: {
      institutionId,
      ...(status && { status }),
      ...(originalStaffId && { originalStaffId }),
      ...(substituteStaffId && { substituteStaffId }),
      ...(departmentId && { originalStaff: { departmentId } }),
      ...(from && { date: { gte: toDateOnly(from) } }),
    },
    include: requestInclude,
    orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
  });

/** Teachers with no class, no approved cover and no approved leave in that slot on that date. */
const findAvailableSubstitutes = async ({ institutionId, requestId }) => {
  const request = await prisma.substituteRequest.findFirst({ where: { id: requestId, institutionId }, include: { entry: true } });
  if (!request) throw new NotFoundError('Substitute request not found');
  const { dayOfWeek, period } = request.entry;

  const [busy, covering, onLeave, staff] = await Promise.all([
    prisma.timetableEntry.findMany({ where: { dayOfWeek, period, staffId: { not: null }, timetable: { institutionId } }, select: { staffId: true } }),
    prisma.substituteRequest.findMany({
      where: { institutionId, date: request.date, status: 'APPROVED', substituteStaffId: { not: null }, entry: { period } },
      select: { substituteStaffId: true },
    }),
    prisma.leaveRequest.findMany({
      where: { institutionId, staffId: { not: null }, status: 'APPROVED', startDate: { lte: request.date }, endDate: { gte: request.date } },
      select: { staffId: true },
    }),
    prisma.staff.findMany({
      where: { institutionId, deletedAt: null, status: 'ACTIVE', staffType: 'TEACHING', id: { not: request.originalStaffId } },
      select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true, user: { select: { email: true } } },
      orderBy: [{ firstName: 'asc' }],
    }),
  ]);

  const unavailable = new Set([...busy.map((b) => b.staffId), ...covering.map((c) => c.substituteStaffId), ...onLeave.map((l) => l.staffId)]);
  return staff.filter((s) => !unavailable.has(s.id));
};

const reviewSubstituteRequest = async ({ institutionId, userId, requestId, decision, substituteStaffId, remarks }) => {
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new ValidationError('decision must be APPROVE or REJECT');
  const request = await prisma.substituteRequest.findFirst({ where: { id: requestId, institutionId } });
  if (!request) throw new NotFoundError('Substitute request not found');
  if (request.status !== 'PENDING') throw new BusinessRuleError(`This request was already ${request.status.toLowerCase()}`);
  if (request.requestedById === userId) throw new BusinessRuleError('A substitute request must be reviewed by someone other than the requester');

  const reviewed = { reviewedById: userId, reviewedAt: new Date(), reviewRemarks: remarks ? String(remarks).trim() : null };

  if (decision === 'REJECT') {
    if (!reviewed.reviewRemarks) throw new ValidationError('A reason is required when rejecting a substitute request');
    const updated = await prisma.substituteRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', ...reviewed }, include: requestInclude });
    await audit(institutionId, userId, 'SUBSTITUTE_REJECTED', requestId);
    return updated;
  }

  if (!substituteStaffId) throw new ValidationError('Choose a substitute teacher to approve this request');
  const available = await findAvailableSubstitutes({ institutionId, requestId });
  if (!available.some((s) => s.id === substituteStaffId)) {
    throw new BusinessRuleError('That teacher is not free for this period on that date');
  }

  const updated = await prisma.substituteRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED', substituteStaffId, ...reviewed },
    include: requestInclude,
  });
  await audit(institutionId, userId, 'SUBSTITUTE_APPROVED', requestId, { substituteStaffId });
  return updated;
};

const cancelSubstituteRequest = async ({ institutionId, userId, staffId, requestId }) => {
  const request = await prisma.substituteRequest.findFirst({ where: { id: requestId, institutionId } });
  if (!request) throw new NotFoundError('Substitute request not found');
  if (request.originalStaffId !== staffId) throw new BusinessRuleError('You can only cancel your own requests');
  if (request.status !== 'PENDING') throw new BusinessRuleError('Only pending requests can be cancelled');
  const updated = await prisma.substituteRequest.update({ where: { id: requestId }, data: { status: 'CANCELLED' }, include: requestInclude });
  await audit(institutionId, userId, 'SUBSTITUTE_CANCELLED', requestId);
  return updated;
};

module.exports = {
  DAYS,
  findConflicts,
  createSubstituteRequest,
  listSubstituteRequests,
  findAvailableSubstitutes,
  reviewSubstituteRequest,
  cancelSubstituteRequest,
};
