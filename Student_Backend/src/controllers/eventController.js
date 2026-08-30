/**
 * Student — Campus Events Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { institutionId: req.institutionId },
      include: { registrations: { where: { studentId: req.user.studentId } } },
      orderBy: { eventDate: 'asc' },
    });

    const withRegistration = events.map((e) => ({ ...e, isRegistered: e.registrations.length > 0, registrations: undefined }));
    return sendSuccess(res, withRegistration, 'Events retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) throw new ValidationError('eventId is required');

    const event = await prisma.event.findFirst({ where: { id: eventId, institutionId: req.institutionId } });
    if (!event) throw new NotFoundError('Event not found');

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_studentId: { eventId, studentId: req.user.studentId } },
    });
    if (existing) return sendSuccess(res, existing, 'Already registered for this event');

    const registration = await prisma.eventRegistration.create({
      data: { eventId, studentId: req.user.studentId },
    });

    return sendSuccess(res, registration, `Registered for ${event.title}`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents, registerForEvent };
