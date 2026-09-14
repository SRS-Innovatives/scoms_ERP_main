/**
 * Student Profile & Academics Controller
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

/** Fields a student may edit about themselves — never admission/academic/identity fields. */
const SELF_EDITABLE_FIELDS = ['email', 'phone', 'address', 'city', 'state', 'pincode'];

const getProfile = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        institution: { select: { name: true, code: true, logo: true } },
        user: { select: { avatar: true } },
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

    // avatar lives on User, not Student — updated separately, same validation as every
    // other portal's profile-photo upload.
    if (req.body.avatar !== undefined) {
      const { avatar } = req.body;
      if (avatar !== '' && !/^data:image\/(png|jpeg|jpg);base64,/.test(avatar)) {
        throw new ValidationError('Profile photo must be a PNG or JPEG image');
      }
      await prisma.user.update({ where: { id: req.user.id }, data: { avatar: avatar === '' ? null : avatar } });
    }

    const student = await prisma.student.update({
      where: { id: req.user.studentId },
      data,
      include: { institution: { select: { name: true } }, user: { select: { avatar: true } }, department: true, course: true, section: true, parents: { include: { parent: true } } },
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
      where: { classMappings: { some: { courseId: student.courseId } } },
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

/** Everything the Digital ID Card page needs in one call — student identity/photo,
 * institution letterhead, and the institution's chosen orientation/template so every
 * student's card renders exactly the way their Institute Admin configured it. */
const getIdCard = async (req, res, next) => {
  try {
    const [student, settings] = await Promise.all([
      prisma.student.findUnique({
        where: { id: req.user.studentId },
        include: {
          institution: { select: { name: true, code: true, logo: true, address: true, city: true, state: true, pincode: true } },
          user: { select: { avatar: true } },
          course: { select: { name: true } },
          department: { select: { name: true } },
          section: { select: { name: true, semester: { select: { name: true, academicYear: { select: { yearName: true } } } } } },
          parents: { include: { parent: { select: { fatherName: true, fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
        },
      }),
      prisma.institutionSettings.findUnique({
        where: { institutionId: req.institutionId },
        select: { idCardOrientation: true, idCardTemplate: true },
      }),
    ]);

    if (!student) throw new NotFoundError('Student profile not found');

    const parentContact = student.parents[0]?.parent;
    return sendSuccess(res, {
      student: { ...student, parents: undefined },
      parentPhone: parentContact?.fatherPhone || parentContact?.motherPhone || parentContact?.guardianPhone || null,
      parentName: parentContact?.fatherName || null,
      orientation: settings?.idCardOrientation || 'VERTICAL',
      template: settings?.idCardTemplate || 'CLASSIC',
    }, 'ID card data retrieved');
  } catch (err) {
    next(err);
  }
};

/** This student's own degree record(s) — pending or issued. Empty for most students most
 * of the time; only ever populated once the institution actually creates a record for them. */
const getMyDegrees = async (req, res, next) => {
  try {
    const degrees = await prisma.degreeRecord.findMany({
      where: { studentId: req.user.studentId },
      include: { issuingInstitution: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, degrees, 'Degree records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAttendanceSummary,
  getMySubjects,
  getIdCard,
  getMyDegrees,
};
