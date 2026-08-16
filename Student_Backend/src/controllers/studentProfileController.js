/**
 * Student Profile & Academics Controller
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
} = require('../../../shared');

const getProfile = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        department: true,
        course: true,
        section: true,
        parents: { include: { parent: true } },
      },
    });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    return sendSuccess(res, student, 'Student profile retrieved');
  } catch (err) {
    next(err);
  }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: req.user.studentId },
      include: { session: true },
    });

    const totalClasses = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 100.0;

    return sendSuccess(res, {
      totalClasses,
      presentCount,
      absentCount: totalClasses - presentCount,
      percentage: Number(percentage),
      records,
    }, 'Attendance summary retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  getAttendanceSummary,
};
