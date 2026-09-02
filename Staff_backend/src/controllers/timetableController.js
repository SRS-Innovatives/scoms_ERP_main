/**
 * Staff Timetable Controller — read-only, this staff member's own schedule.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getMyTimetable = async (req, res, next) => {
  try {
    const entries = await prisma.timetableEntry.findMany({
      where: { staffId: req.user.staffId, timetable: { institutionId: req.institutionId } },
      include: {
        subject: { select: { name: true, code: true } },
        timetable: { select: { section: { select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } } } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    return sendSuccess(res, entries, 'Timetable retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTimetable,
};
