/**
 * Institute Admin Timetable Controller
 *
 * One timetable per section. Institute Admin builds the weekly grid (day x period),
 * each slot optionally carrying a real subject + real teacher (validated against the
 * tenant's own SubjectTeacherMapping data), or a free-text label for non-class slots
 * like Assembly/Lunch. Staff and Student portals read the same rows.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  resolveRoomsById,
  timetableRules,
} = require('../../../shared');

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/** Get-or-create the timetable for a section, with its current entries. */
const getTimetable = async (req, res, next) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) throw new ValidationError('sectionId is required');

    const section = await prisma.section.findFirst({
      where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } },
    });
    if (!section) throw new NotFoundError('Section not found or access denied');

    const timetable = await prisma.timetable.upsert({
      where: { institutionId_sectionId: { institutionId: req.institutionId, sectionId } },
      create: { institutionId: req.institutionId, sectionId },
      update: {},
      include: {
        entries: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            staff: { select: { id: true, employeeCode: true, user: { select: { email: true } } } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        },
      },
    });

    return sendSuccess(res, timetable, 'Timetable retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Replace the full set of entries for a timetable in one transaction (grid save). */
const saveEntries = async (req, res, next) => {
  try {
    const { timetableId } = req.params;
    const { entries } = req.body;

    if (!Array.isArray(entries)) throw new ValidationError('entries must be an array');

    const timetable = await prisma.timetable.findFirst({ where: { id: timetableId, institutionId: req.institutionId } });
    if (!timetable) throw new NotFoundError('Timetable not found or access denied');

    const validEntries = entries.filter((e) => e.dayOfWeek && e.period && (e.subjectId || e.label));
    for (const e of validEntries) {
      if (!DAYS.includes(e.dayOfWeek)) throw new ValidationError(`Invalid dayOfWeek: ${e.dayOfWeek}`);
    }

    const subjectIds = [...new Set(validEntries.map((e) => e.subjectId).filter(Boolean))];
    const staffIds = [...new Set(validEntries.map((e) => e.staffId).filter(Boolean))];

    if (subjectIds.length > 0) {
      const count = await prisma.subject.count({ where: { id: { in: subjectIds }, institutionId: req.institutionId } });
      if (count !== subjectIds.length) throw new ValidationError('One or more subjects are invalid for this institution');
    }
    if (staffIds.length > 0) {
      const count = await prisma.staff.count({ where: { id: { in: staffIds }, institutionId: req.institutionId } });
      if (count !== staffIds.length) throw new ValidationError('One or more staff are invalid for this institution');
    }
    const roomsById = await resolveRoomsById(validEntries.map((e) => e.roomId), req.institutionId);

    const rows = validEntries.map((e) => ({
      dayOfWeek: e.dayOfWeek,
      period: Number(e.period),
      startTime: e.startTime || '',
      endTime: e.endTime || '',
      subjectId: e.subjectId || null,
      staffId: e.staffId || null,
      label: e.subjectId ? null : e.label || null,
      roomNumber: e.roomNumber || roomsById.get(e.roomId)?.roomNumber || null,
      roomId: e.roomId || null,
    }));

    const conflicts = await timetableRules.findConflicts({ institutionId: req.institutionId, timetableId, entries: rows });
    if (conflicts.length > 0 && !req.body.allowConflicts) {
      throw new ValidationError('Teacher or room is already booked in another section for some periods', conflicts);
    }

    // Update slots in place so entry ids (and substitute requests that point at them) survive a save.
    const existing = await prisma.timetableEntry.findMany({ where: { timetableId }, select: { id: true, dayOfWeek: true, period: true, staffId: true } });
    const existingBySlot = new Map(existing.map((x) => [`${x.dayOfWeek}_${x.period}`, x]));
    const keep = new Set(rows.map((r) => `${r.dayOfWeek}_${r.period}`));
    const removedIds = existing.filter((x) => !keep.has(`${x.dayOfWeek}_${x.period}`)).map((x) => x.id);
    const teacherChangedIds = rows
      .map((r) => ({ r, x: existingBySlot.get(`${r.dayOfWeek}_${r.period}`) }))
      .filter(({ r, x }) => x && x.staffId !== r.staffId)
      .map(({ x }) => x.id);

    await prisma.$transaction([
      ...(teacherChangedIds.length > 0
        ? [prisma.substituteRequest.updateMany({ where: { timetableEntryId: { in: teacherChangedIds }, status: 'PENDING' }, data: { status: 'CANCELLED' } })]
        : []),
      prisma.timetableEntry.deleteMany({ where: { id: { in: removedIds } } }),
      ...rows.map((r) =>
        prisma.timetableEntry.upsert({
          where: { timetableId_dayOfWeek_period: { timetableId, dayOfWeek: r.dayOfWeek, period: r.period } },
          create: { timetableId, ...r },
          update: r,
        })
      ),
    ]);

    const updated = await prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        entries: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            staff: { select: { id: true, employeeCode: true, user: { select: { email: true } } } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        },
      },
    });

    return sendSuccess(res, { ...updated, conflicts }, conflicts.length > 0 ? 'Timetable saved with clashes' : 'Timetable saved successfully');
  } catch (err) {
    next(err);
  }
};

/** Every entry a given teacher is scheduled for, across all their sections. */
const getTeacherTimetable = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const staff = await prisma.staff.findFirst({ where: { id: staffId, institutionId: req.institutionId } });
    if (!staff) throw new NotFoundError('Staff not found or access denied');

    const entries = await prisma.timetableEntry.findMany({
      where: { staffId, timetable: { institutionId: req.institutionId } },
      include: {
        subject: { select: { name: true, code: true } },
        timetable: { select: { section: { select: { name: true, semester: { select: { course: { select: { name: true } } } } } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    return sendSuccess(res, entries, 'Teacher timetable retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getSubstituteRequests = async (req, res, next) => {
  try {
    const { status, from } = req.query;
    const data = await timetableRules.listSubstituteRequests({ institutionId: req.institutionId, status, from });
    return sendSuccess(res, data, 'Substitute requests retrieved');
  } catch (err) {
    next(err);
  }
};

const getAvailableSubstitutes = async (req, res, next) => {
  try {
    const data = await timetableRules.findAvailableSubstitutes({ institutionId: req.institutionId, requestId: req.params.id });
    return sendSuccess(res, data, 'Available teachers retrieved');
  } catch (err) {
    next(err);
  }
};

const reviewSubstituteRequest = async (req, res, next) => {
  try {
    const { decision, substituteStaffId, remarks } = req.body;
    const data = await timetableRules.reviewSubstituteRequest({
      institutionId: req.institutionId,
      userId: req.user.id,
      requestId: req.params.id,
      decision,
      substituteStaffId,
      remarks,
    });
    return sendSuccess(res, data, `Substitute request ${data.status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTimetable,
  saveEntries,
  getTeacherTimetable,
  getSubstituteRequests,
  getAvailableSubstitutes,
  reviewSubstituteRequest,
};
