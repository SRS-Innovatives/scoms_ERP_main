/**
 * Student/Parent — Academic Calendar (read-only)
 *
 * Institute Admin owns creating/editing calendar events; students and parents only view them.
 * ?from=&to= returns events overlapping the range (shared/academic/calendarEvents.js).
 */
const { sendSuccess } = require('../../../shared');
const { listCalendarEvents } = require('../../../shared/academic/calendarEvents');

const getEvents = async (req, res, next) => {
  try {
    const events = await listCalendarEvents(req.institutionId, req.query);
    return sendSuccess(res, events, 'Academic calendar events retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents };
