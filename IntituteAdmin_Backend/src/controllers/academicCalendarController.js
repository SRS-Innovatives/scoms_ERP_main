/**
 * Institute Admin — Academic Calendar
 *
 * A simple institution-wide calendar (holidays, exam windows, events, deadlines) —
 * read across every portal, written only here. Deliberately not merged into Exam/Event/
 * etc: those already carry their own detail and their own dates; this is the plain
 * at-a-glance list, including holidays that don't belong to any other model at all.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const EVENT_TYPES = ['HOLIDAY', 'EXAM', 'EVENT', 'DEADLINE', 'OTHER'];

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

const createEvent = async (req, res, next) => {
  try {
    const { title, description, eventType = 'EVENT', startDate, endDate } = req.body;
    if (!title || !startDate) throw new ValidationError('title and startDate are required');
    if (!EVENT_TYPES.includes(eventType)) throw new ValidationError(`eventType must be one of ${EVENT_TYPES.join(', ')}`);
    if (endDate && new Date(endDate) < new Date(startDate)) throw new ValidationError('endDate cannot be before startDate');

    const event = await prisma.academicCalendarEvent.create({
      data: {
        institutionId: req.institutionId,
        title,
        description: description || null,
        eventType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return sendSuccess(res, event, 'Calendar event created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.academicCalendarEvent.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Calendar event not found');

    const { title, description, eventType, startDate, endDate } = req.body;
    if (eventType && !EVENT_TYPES.includes(eventType)) throw new ValidationError(`eventType must be one of ${EVENT_TYPES.join(', ')}`);

    const event = await prisma.academicCalendarEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(eventType !== undefined && { eventType }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });
    return sendSuccess(res, event, 'Calendar event updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.academicCalendarEvent.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Calendar event not found');
    await prisma.academicCalendarEvent.delete({ where: { id } });
    return sendSuccess(res, null, 'Calendar event deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
