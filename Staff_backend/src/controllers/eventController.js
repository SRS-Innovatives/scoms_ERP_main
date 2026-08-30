/**
 * Staff — Campus Events Controller (read-only view of the institution's events calendar,
 * plus marking co-curricular attendance for registered students)
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

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

/** Registered students for one event, with their real attendance flag. */
const getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findFirst({ where: { id: eventId, institutionId: req.institutionId } });
    if (!event) throw new NotFoundError('Event not found');

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } } },
      orderBy: { student: { rollNumber: 'asc' } },
    });

    return sendSuccess(res, { event, registrations }, 'Event registrations retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Marks real attendance for a batch of a given event's registered students. */
const markEventAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { records } = req.body; // [{ registrationId, attended }]

    const event = await prisma.event.findFirst({ where: { id: eventId, institutionId: req.institutionId } });
    if (!event) throw new NotFoundError('Event not found');

    await prisma.$transaction(
      (records || []).map((r) =>
        prisma.eventRegistration.update({
          where: { id: r.registrationId, eventId },
          data: { attended: !!r.attended, attendedAt: r.attended ? new Date() : null },
        })
      )
    );

    return sendSuccess(res, null, 'Event attendance recorded successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents, getEventRegistrations, markEventAttendance };
