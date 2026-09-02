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
      const count = await prisma.subject.count({ where: { id: { in: subjectIds }, course: { institutionId: req.institutionId } } });
      if (count !== subjectIds.length) throw new ValidationError('One or more subjects are invalid for this institution');
    }
    if (staffIds.length > 0) {
      const count = await prisma.staff.count({ where: { id: { in: staffIds }, institutionId: req.institutionId } });
      if (count !== staffIds.length) throw new ValidationError('One or more staff are invalid for this institution');
    }

    await prisma.$transaction([
      prisma.timetableEntry.deleteMany({ where: { timetableId } }),
      ...(validEntries.length > 0
        ? [
            prisma.timetableEntry.createMany({
              data: validEntries.map((e) => ({
                timetableId,
                dayOfWeek: e.dayOfWeek,
                period: Number(e.period),
                startTime: e.startTime || '',
                endTime: e.endTime || '',
                subjectId: e.subjectId || null,
                staffId: e.staffId || null,
                label: e.subjectId ? null : e.label || null,
                roomNumber: e.roomNumber || null,
              })),
            }),
          ]
        : []),
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

    return sendSuccess(res, updated, 'Timetable saved successfully');
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

module.exports = {
  getTimetable,
  saveEntries,
  getTeacherTimetable,
};
