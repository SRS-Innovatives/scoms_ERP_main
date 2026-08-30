/**
 * Student Timetable Controller — read-only, this student's own section's weekly schedule.
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

const getTimetable = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      select: { sectionId: true },
    });
    if (!student || !student.sectionId) throw new NotFoundError('Student is not assigned to a section yet');

    const timetable = await prisma.timetable.findUnique({
      where: { institutionId_sectionId: { institutionId: req.institutionId, sectionId: student.sectionId } },
      include: {
        entries: {
          include: {
            subject: { select: { name: true, code: true } },
            staff: { select: { employeeCode: true, user: { select: { email: true } } } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        },
      },
    });

    return sendSuccess(res, timetable?.entries || [], 'Timetable retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTimetable,
};
