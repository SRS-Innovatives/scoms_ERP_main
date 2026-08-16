/**
 * Institute Admin Student Management Controller
 */

const {
  prisma,
  sendSuccess,
  sendPaginated,
  hashPassword,
  generateAdmissionNumber,
  ROLES,
} = require('../../../shared');

const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', departmentId, courseId, sectionId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      institutionId: req.institutionId,
      ...(departmentId && { departmentId }),
      ...(courseId && { courseId }),
      ...(sectionId && { sectionId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNumber: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          course: { select: { name: true, code: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return sendPaginated(res, students, page, limit, total, 'Students retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createStudentAdmission = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      gender,
      email,
      phone,
      departmentId,
      courseId,
      sectionId,
      rollNumber,
      password,
    } = req.body;

    const count = await prisma.student.count({
      where: { institutionId: req.institutionId },
    });

    const admissionNumber = generateAdmissionNumber('ADM', count + 1);
    const hashedPassword = await hashPassword(password || 'Student@123');

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          institutionId: req.institutionId,
          email,
          admissionNumber,
          password: hashedPassword,
          role: ROLES.STUDENT,
          status: 'ACTIVE',
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          institutionId: req.institutionId,
          admissionNumber,
          rollNumber,
          firstName,
          lastName,
          dob: new Date(dob),
          gender,
          email,
          phone,
          departmentId,
          courseId,
          sectionId,
        },
      });

      return { student, user };
    });

    return sendSuccess(res, result, 'Student admitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  createStudentAdmission,
};
