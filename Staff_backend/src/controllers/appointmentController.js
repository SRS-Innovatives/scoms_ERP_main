/**
 * Staff — Appointment Requests Controller (counselling / mentorship slot approvals)
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_STATUSES = ['APPROVED', 'REJECTED', 'COMPLETED'];

const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { staffId: req.user.staffId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
      orderBy: { slotDate: 'desc' },
    });
    return sendSuccess(res, appointments, 'Appointments retrieved');
  } catch (err) {
    next(err);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const appointment = await prisma.appointment.findFirst({ where: { id, staffId: req.user.staffId } });
    if (!appointment) throw new NotFoundError('Appointment not found or access denied');

    const updated = await prisma.appointment.update({ where: { id }, data: { status } });
    return sendSuccess(res, updated, `Appointment ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyAppointments, updateAppointmentStatus };
