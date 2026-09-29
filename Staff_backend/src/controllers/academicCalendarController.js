/**
 * Staff — Academic Calendar (read-only)
 *
 * Institute Admin owns creating/editing calendar events; Staff only views them.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getEvents = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const events = await prisma.academicCalendarEvent.findMany({
      where: {
        institutionId: req.institutionId,
        ...(from && { startDate: { gte: new Date(from) } }),
        ...(to && { startDate: { lte: new Date(to) } }),
      },
      orderBy: { startDate: 'asc' },
    });
    return sendSuccess(res, events, 'Academic calendar events retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents };
