/**
 * Staff Attendance Controller (Recording daily / subject student attendance)
 */

const {
  prisma,
  sendSuccess,
  ConflictError,
} = require('../../../shared');

const markAttendance = async (req, res, next) => {
  try {
    const { sectionId, subjectId, date, periodNumber = 1, records } = req.body;
    const sessionDate = new Date(date);

    // Prevent duplicate attendance recording for same section, subject, date, period
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        institutionId: req.institutionId,
        sectionId,
        date: sessionDate,
        periodNumber: Number(periodNumber),
      },
    });

    if (existingSession) {
      throw new ConflictError('Attendance has already been recorded for this section, date, and period');
    }

    const session = await prisma.attendanceSession.create({
      data: {
        institutionId: req.institutionId,
        sectionId,
        subjectId,
        takenById: req.user.staffId,
        date: sessionDate,
        periodNumber: Number(periodNumber),
        records: {
          create: records.map((rec) => ({
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks,
          })),
        },
      },
      include: {
        records: true,
      },
    });

    return sendSuccess(res, session, 'Attendance session recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  markAttendance,
};
