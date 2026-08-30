/**
 * Student Profile & Academics Controller
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
} = require('../../../shared');

/** Fields a student may edit about themselves — never admission/academic/identity fields. */
const SELF_EDITABLE_FIELDS = ['email', 'phone', 'address', 'city', 'state', 'pincode'];

const getProfile = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        institution: { select: { name: true, code: true, logo: true } },
        department: true,
        course: true,
        section: {
          include: {
            semester: {
              select: { name: true, semesterNumber: true, academicYear: { select: { yearName: true } } },
            },
          },
        },
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
      include: { session: { include: { subject: { select: { name: true } } } } },
      orderBy: { session: { date: 'desc' } },
    });

    const totalClasses = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 100.0;

    // Subject-wise breakdown
    const bySubject = {};
    records.forEach((r) => {
      const key = r.session.subject?.name || 'General';
      if (!bySubject[key]) bySubject[key] = { subject: key, total: 0, present: 0 };
      bySubject[key].total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') bySubject[key].present++;
    });
    const subjectBreakdown = Object.values(bySubject).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(1)) : 100,
    }));

    return sendSuccess(res, {
      totalClasses,
      presentCount,
      absentCount: totalClasses - presentCount,
      percentage: Number(percentage),
      subjectBreakdown,
      records: records.map((r) => ({
        id: r.id,
        date: r.session.date,
        subject: r.session.subject?.name || 'General',
        status: r.status,
        remarks: r.remarks,
      })),
    }, 'Attendance summary retrieved');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = {};
    for (const field of SELF_EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    const student = await prisma.student.update({
      where: { id: req.user.studentId },
      data,
      include: { institution: { select: { name: true } }, department: true, course: true, section: true, parents: { include: { parent: true } } },
    });

    return sendSuccess(res, student, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Subjects taught in the student's own course, with the assigned faculty for each. */
const getMySubjects = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Subjects retrieved');

    const subjects = await prisma.subject.findMany({
      where: { courseId: student.courseId },
      include: {
        teacherMappings: {
          take: 1,
          include: { staff: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const withFaculty = subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      type: s.type,
      faculty: s.teacherMappings[0]?.staff ? `${s.teacherMappings[0].staff.firstName} ${s.teacherMappings[0].staff.lastName}` : 'Not yet assigned',
    }));

    return sendSuccess(res, withFaculty, 'Subjects retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAttendanceSummary,
  getMySubjects,
};
