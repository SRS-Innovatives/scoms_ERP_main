/**
 * Staff and Teacher Assignment Controller
 */

const {
  prisma,
  sendSuccess,
  hashPassword,
} = require('../../../shared');

const getStaff = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { institutionId: req.institutionId },
      include: {
        user: { select: { email: true, mobile: true, role: true } },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, staff, 'Staff retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeCode,
      designation,
      departmentId,
      qualification,
      joiningDate,
      role, // e.g. TEACHER, HOD, ACCOUNTANT
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate employee code
      const existingStaff = await tx.staff.findUnique({
        where: { institutionId_employeeCode: { institutionId: req.institutionId, employeeCode } }
      });
      if (existingStaff) throw new Error('Employee code already exists');

      // 2. Validate email if provided
      if (email) {
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) throw new Error('Email already registered');
      }

      // 3. Validate department if provided
      if (departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: departmentId, institutionId: req.institutionId }
        });
        if (!dept) throw new Error('Department not found or access denied');
      }

      // 4. Create user
      const defaultPassword = 'Password@123';
      const hashedPassword = await hashPassword(defaultPassword);

      const user = await tx.user.create({
        data: {
          institutionId: req.institutionId,
          email,
          mobile: phone,
          employeeCode,
          password: hashedPassword,
          role: role || 'TEACHER',
        }
      });

      // 5. Create Staff profile
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          institutionId: req.institutionId,
          employeeCode,
          departmentId,
          designation,
          qualification,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        }
      });

      return { ...staff, user: { email: user.email, role: user.role } };
    });

    return sendSuccess(res, result, 'Staff registered successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('already registered')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// Phase 14: Teacher Assignment
const getTeacherAssignments = async (req, res, next) => {
  try {
    const assignments = await prisma.subjectTeacherMapping.findMany({
      where: { staff: { institutionId: req.institutionId } },
      include: {
        staff: { include: { user: { select: { email: true } } } },
        subject: { include: { course: true } }
      }
    });
    return sendSuccess(res, assignments, 'Teacher assignments retrieved');
  } catch (err) {
    next(err);
  }
};

const assignTeacher = async (req, res, next) => {
  try {
    const { staffId, subjectId, sectionId } = req.body;

    // Validate staff belongs to tenant
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, institutionId: req.institutionId }
    });
    if (!staff) throw new Error('Staff not found or access denied');

    // Validate subject belongs to tenant
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, course: { institutionId: req.institutionId } }
    });
    if (!subject) throw new Error('Subject not found or access denied');

    const assignment = await prisma.subjectTeacherMapping.create({
      data: {
        staffId,
        subjectId,
        sectionId,
      }
    });

    return sendSuccess(res, assignment, 'Teacher assigned successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStaff,
  createStaff,
  getTeacherAssignments,
  assignTeacher,
};
