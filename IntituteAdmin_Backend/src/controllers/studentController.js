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
      bloodGroup,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      
      fatherName,
      motherName,
      guardianName,
      parentPhone,
      parentEmail,
      
      departmentId,
      courseId,
      semesterId,
      sectionId,
      rollNumber,
      password,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate Academic setup belongs to Tenant
      if (sectionId) {
        const section = await tx.section.findFirst({
          where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } }
        });
        if (!section) throw new Error('Invalid section or access denied');
      }

      // 2. Generate admission number (better safe generation using count)
      const count = await tx.student.count({
        where: { institutionId: req.institutionId },
      });
      const year = new Date().getFullYear();
      const paddedCount = String(count + 1).padStart(6, '0');
      const admissionNumber = `SCOMS/${year}/${paddedCount}`;

      // 3. Create User Login
      const hashedPassword = await hashPassword(password || 'Student@123');
      const user = await tx.user.create({
        data: {
          institutionId: req.institutionId,
          email,
          mobile: phone,
          admissionNumber,
          password: hashedPassword,
          role: ROLES.STUDENT,
          status: 'ACTIVE',
        },
      });

      // 4. Create Student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          institutionId: req.institutionId,
          admissionNumber,
          rollNumber,
          firstName,
          lastName,
          dob: new Date(dob),
          gender: gender || 'OTHER',
          bloodGroup,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          departmentId,
          courseId,
          semesterId,
          sectionId,
        },
      });

      // 5. Create Parent User (Optional but requested)
      if (fatherName || motherName || guardianName) {
        const parentPassword = await hashPassword('Parent@123');
        const parentUser = await tx.user.create({
          data: {
            institutionId: req.institutionId,
            email: parentEmail || `parent.${admissionNumber.replace(/\//g, '')}@scoms.edu.in`,
            mobile: parentPhone,
            password: parentPassword,
            role: ROLES.PARENT,
            status: 'ACTIVE',
          }
        });

        const parent = await tx.parent.create({
          data: {
            userId: parentUser.id,
            fatherName,
            motherName,
            guardianName,
            fatherPhone: parentPhone,
            address,
          }
        });

        await tx.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relation: fatherName ? 'FATHER' : (motherName ? 'MOTHER' : 'GUARDIAN')
          }
        });
      }

      // 6. Create Audit Log
      await tx.auditLog.create({
        data: {
          institutionId: req.institutionId,
          userId: req.user.id,
          action: 'CREATE',
          module: 'STUDENT',
          entity: 'Student',
          entityId: student.id,
          newValues: JSON.stringify({ admissionNumber: student.admissionNumber }),
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || ''
        }
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
