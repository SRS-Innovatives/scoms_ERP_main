/**
 * Institute Admin — Campus Events Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { registrations: true } } },
      orderBy: { eventDate: 'asc' },
    });
    return sendSuccess(res, events, 'Events retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, eventDate, venue } = req.body;
    if (!title || !eventDate) throw new ValidationError('title and eventDate are required');

    const event = await prisma.event.create({
      data: { institutionId: req.institutionId, title, description, eventDate: new Date(eventDate), venue },
    });

    return sendSuccess(res, event, 'Event published to the campus calendar', 201);
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Event not found');

    await prisma.event.delete({ where: { id } });
    return sendSuccess(res, null, 'Event removed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents, createEvent, deleteEvent };
