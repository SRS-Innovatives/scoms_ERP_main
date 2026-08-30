/**
 * Student — Counselling / Mentorship Appointment Booking Controller
 *
 * A student can only book with staff who actually teach their section (same
 * SubjectTeacherMapping-derived directory used by Messaging), never an arbitrary staffId.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getMyTeachers = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { sectionId: true } });
    if (!student?.sectionId) return sendSuccess(res, [], 'Teachers retrieved');

    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { sectionId: student.sectionId },
      include: { staff: { select: { id: true, firstName: true, lastName: true, designation: true } } },
      distinct: ['staffId'],
    });

    const teachers = mappings.map((m) => ({ id: m.staff.id, name: `${m.staff.firstName} ${m.staff.lastName}`, designation: m.staff.designation }));
    return sendSuccess(res, teachers, 'Teachers retrieved');
  } catch (err) {
    next(err);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { studentId: req.user.studentId },
      include: { staff: { select: { firstName: true, lastName: true, designation: true } } },
      orderBy: { slotDate: 'desc' },
    });
    return sendSuccess(res, appointments, 'Appointments retrieved');
  } catch (err) {
    next(err);
  }
};

const bookAppointment = async (req, res, next) => {
  try {
    const { staffId, slotDate, slotTime, purpose } = req.body;
    if (!staffId || !slotDate || !slotTime) throw new ValidationError('staffId, slotDate and slotTime are required');

    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { sectionId: true } });
    const isMyTeacher = await prisma.subjectTeacherMapping.findFirst({ where: { sectionId: student?.sectionId, staffId } });
    if (!isMyTeacher) throw new NotFoundError('Teacher not found or access denied');

    const appointment = await prisma.appointment.create({
      data: { institutionId: req.institutionId, studentId: req.user.studentId, staffId, slotDate: new Date(slotDate), slotTime, purpose },
    });

    return sendSuccess(res, appointment, 'Appointment slot requested', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyTeachers, getMyAppointments, bookAppointment };
