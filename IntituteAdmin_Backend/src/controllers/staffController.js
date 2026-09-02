/**
 * Institute Admin Staff Controller
 *
 * Staff (HR record, linked 1:1 to a login User) -> StaffQualification / StaffExperience
 * (multi-entry academic & service history) / StaffSalary (one active pay structure per
 * staff) / StaffAttendance (daily self attendance) / LeaveRequest (shared model, also
 * used by students — staffId branch here). SubjectTeacherMapping is the class/subject
 * assignment used by Attendance/Timetable/Examination.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  hashPassword,
  sendEmailNotification,
  sendSMSNotification,
  generateEmployeeCode,
} = require('../../../shared');

const computeGross = (salary) => {
  if (!salary) return 0;
  return salary.basicPay + salary.hra + salary.da + salary.otherAllowances - salary.deductions;
};

// ============================================================
// Staff Directory
// ============================================================
const getStaff = async (req, res, next) => {
  try {
    const { staffType } = req.query;
    const staff = await prisma.staff.findMany({
      where: { institutionId: req.institutionId, ...(staffType && { staffType }) },
      include: {
        user: { select: { email: true, mobile: true, role: true } },
        department: true,
        salary: true,
        qualifications: { orderBy: { yearOfPassing: 'desc' } },
        experiences: { orderBy: { fromDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, staff, 'Staff retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findFirst({
      where: { id, institutionId: req.institutionId },
      include: {
        user: { select: { email: true, mobile: true, role: true } },
        department: true,
        salary: true,
        qualifications: { orderBy: { yearOfPassing: 'desc' } },
        experiences: { orderBy: { fromDate: 'desc' } },
      },
    });
    if (!staff) throw new NotFoundError('Staff member not found');
    return sendSuccess(res, staff, 'Staff profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, designation, departmentId, qualification, experience, status, staffType } = req.body;

    const existing = await prisma.staff.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Staff member not found');

    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, institutionId: req.institutionId } });
      if (!dept) throw new NotFoundError('Department not found or access denied');
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(designation && { designation }),
        ...(departmentId && { departmentId }),
        ...(qualification !== undefined && { qualification }),
        ...(experience !== undefined && { experience }),
        ...(status && { status }),
        ...(staffType && { staffType }),
      },
    });
    return sendSuccess(res, staff, 'Staff profile updated successfully');
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
      designation,
      departmentId,
      qualification,
      experience,
      staffType,
      joiningDate,
      role, // e.g. TEACHER, HOD, ACCOUNTANT
      salary, // optional { basicPay, hra, da, otherAllowances, deductions }
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate the employee code (sequential, tenant-scoped, embeds this
      //    institution's own code — e.g. "DPIS/EMP/2026/0001") — never client-supplied,
      //    so it's always well-formed and always traceable to this institution.
      const [staffCount, institution] = await Promise.all([
        tx.staff.count({ where: { institutionId: req.institutionId } }),
        tx.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } }),
      ]);
      const employeeCode = generateEmployeeCode(institution?.code, staffCount + 1);

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
          userCode: employeeCode, // the staff member's professional platform ID is their employee code — never two IDs for one person
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
          firstName: firstName || '',
          lastName: lastName || '',
          departmentId,
          designation,
          qualification,
          experience,
          staffType: staffType === 'Non-Teaching' || staffType === 'NON_TEACHING' ? 'NON_TEACHING' : 'TEACHING',
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        }
      });

      // 6. Optional initial salary structure
      if (salary && (salary.basicPay || salary.hra || salary.da)) {
        await tx.staffSalary.create({
          data: {
            staffId: staff.id,
            basicPay: Number(salary.basicPay) || 0,
            hra: Number(salary.hra) || 0,
            da: Number(salary.da) || 0,
            otherAllowances: Number(salary.otherAllowances) || 0,
            deductions: Number(salary.deductions) || 0,
          },
        });
      }

      return { ...staff, user: { email: user.email, role: user.role } };
    });

    // Send email & SMS notifications to staff with credentials
    const staffPlainPassword = 'Password@123';
    const staffRole = role || 'TEACHER';
    if (email) {
      sendEmailNotification({
        to: email,
        subject: 'Welcome to SCOMS - Your Staff Account Credentials',
        text: `Dear ${firstName} ${lastName},\n\nWelcome to SCOMS! Your staff account has been successfully created. Here are your login credentials:\n\nLogin URL: http://localhost:5175/login\nEmployee Code: ${result.employeeCode}\nEmail: ${email}\nTemporary Password: ${staffPlainPassword}\nRole: ${staffRole}\n\nPlease change your password after logging in.\n\nBest Regards,\nInstitution Administration`,
        html: `<p>Dear ${firstName} ${lastName},</p><p>Welcome to SCOMS! Your staff account has been successfully created. Here are your login credentials:</p><ul><li><b>Login URL:</b> <a href="http://localhost:5175/login">http://localhost:5175/login</a></li><li><b>Employee Code:</b> ${result.employeeCode}</li><li><b>Email:</b> ${email}</li><li><b>Temporary Password:</b> ${staffPlainPassword}</li><li><b>Role:</b> ${staffRole}</li></ul><p>Please change your password after logging in.</p><p>Best Regards,<br>Institution Administration</p>`,
        institutionId: req.institutionId,
        purpose: 'WELCOME_CREDENTIALS'
      }).catch(err => console.error('Error sending staff welcome email:', err));
    }
    if (phone) {
      sendSMSNotification({
        to: phone,
        message: `Welcome to SCOMS! Your staff account is active. Login at http://localhost:5175/login. User: ${result.employeeCode || email}, Temp Pass: ${staffPlainPassword}`,
        institutionId: req.institutionId,
        purpose: 'WELCOME_CREDENTIALS'
      }).catch(err => console.error('Error sending staff welcome SMS:', err));
    }

    return sendSuccess(res, result, 'Staff registered successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('already registered')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ============================================================
// Qualifications
// ============================================================
const addQualification = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { degree, institutionName, yearOfPassing, grade } = req.body;
    if (!degree || !institutionName || !yearOfPassing) throw new ValidationError('degree, institutionName, yearOfPassing are required');

    const staff = await prisma.staff.findFirst({ where: { id: staffId, institutionId: req.institutionId } });
    if (!staff) throw new NotFoundError('Staff member not found');

    const qualification = await prisma.staffQualification.create({
      data: { staffId, degree, institutionName, yearOfPassing: Number(yearOfPassing), grade: grade || null },
    });
    return sendSuccess(res, qualification, 'Qualification added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Experience
// ============================================================
const addExperience = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { organization, roleTitle, fromDate, toDate, description } = req.body;
    if (!organization || !roleTitle || !fromDate) throw new ValidationError('organization, roleTitle, fromDate are required');

    const staff = await prisma.staff.findFirst({ where: { id: staffId, institutionId: req.institutionId } });
    if (!staff) throw new NotFoundError('Staff member not found');

    const experience = await prisma.staffExperience.create({
      data: { staffId, organization, roleTitle, fromDate: new Date(fromDate), toDate: toDate ? new Date(toDate) : null, description: description || null },
    });
    return sendSuccess(res, experience, 'Experience record added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Salary Structure
// ============================================================
const getSalaries = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { institutionId: req.institutionId },
      include: { user: { select: { email: true } }, department: true, salary: true },
      orderBy: { createdAt: 'desc' },
    });
    const withGross = staff.map((s) => ({ ...s, grossSalary: computeGross(s.salary) }));
    return sendSuccess(res, withGross, 'Salary structures retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const setSalary = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { basicPay, hra, da, otherAllowances, deductions } = req.body;

    const staff = await prisma.staff.findFirst({ where: { id: staffId, institutionId: req.institutionId } });
    if (!staff) throw new NotFoundError('Staff member not found');

    const salary = await prisma.staffSalary.upsert({
      where: { staffId },
      create: {
        staffId,
        basicPay: Number(basicPay) || 0,
        hra: Number(hra) || 0,
        da: Number(da) || 0,
        otherAllowances: Number(otherAllowances) || 0,
        deductions: Number(deductions) || 0,
      },
      update: {
        basicPay: Number(basicPay) || 0,
        hra: Number(hra) || 0,
        da: Number(da) || 0,
        otherAllowances: Number(otherAllowances) || 0,
        deductions: Number(deductions) || 0,
      },
    });
    return sendSuccess(res, { ...salary, grossSalary: computeGross(salary) }, 'Salary structure saved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Staff Self Attendance (daily register — admin oversight/marking)
// ============================================================
const toDateOnly = (dateStr) => {
  if (dateStr) return new Date(dateStr);
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const getStaffAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const day = toDateOnly(date);

    const staff = await prisma.staff.findMany({
      where: { institutionId: req.institutionId, status: 'ACTIVE' },
      include: {
        department: true,
        selfAttendance: { where: { date: day } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const result = staff.map((s) => ({
      id: s.id,
      employeeCode: s.employeeCode,
      firstName: s.firstName,
      lastName: s.lastName,
      designation: s.designation,
      department: s.department,
      attendance: s.selfAttendance[0] || null,
    }));

    return sendSuccess(res, result, 'Staff attendance register retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const markStaffAttendance = async (req, res, next) => {
  try {
    const { records, date } = req.body; // [{ staffId, status, checkInTime, checkOutTime }]
    if (!Array.isArray(records)) throw new ValidationError('records must be an array');

    const day = toDateOnly(date);

    await prisma.$transaction(
      records.map((r) =>
        prisma.staffAttendance.upsert({
          where: { staffId_date: { staffId: r.staffId, date: day } },
          create: { staffId: r.staffId, date: day, status: r.status || 'PRESENT', checkInTime: r.checkInTime || null, checkOutTime: r.checkOutTime || null },
          update: { status: r.status || 'PRESENT', checkInTime: r.checkInTime || null, checkOutTime: r.checkOutTime || null },
        })
      )
    );

    return sendSuccess(res, null, 'Staff attendance recorded successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Leave Management (shared LeaveRequest model)
// ============================================================
const getLeaveRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const leaves = await prisma.leaveRequest.findMany({
      where: { institutionId: req.institutionId, staffId: { not: null }, ...(status && { status }) },
      include: { staff: { select: { employeeCode: true, firstName: true, lastName: true, designation: true, user: { select: { email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, leaves, 'Staff leave requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createLeaveRequest = async (req, res, next) => {
  try {
    const { staffId, startDate, endDate, reason } = req.body;
    if (!staffId || !startDate || !endDate || !reason) throw new ValidationError('staffId, startDate, endDate, reason are required');

    const staff = await prisma.staff.findFirst({ where: { id: staffId, institutionId: req.institutionId } });
    if (!staff) throw new NotFoundError('Staff member not found');

    const leave = await prisma.leaveRequest.create({
      data: { institutionId: req.institutionId, staffId, startDate: new Date(startDate), endDate: new Date(endDate), reason },
    });
    return sendSuccess(res, leave, 'Leave application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED, CANCELLED
    const leave = await prisma.leaveRequest.findFirst({ where: { id, institutionId: req.institutionId, staffId: { not: null } } });
    if (!leave) throw new NotFoundError('Leave request not found');

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: status === 'APPROVED' ? req.user.email : leave.approvedBy },
    });
    return sendSuccess(res, updated, `Leave application ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Teacher Assignment (Phase 14)
// ============================================================
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
  getStaffById,
  updateStaff,
  createStaff,
  addQualification,
  addExperience,
  getSalaries,
  setSalary,
  getStaffAttendance,
  markStaffAttendance,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  getTeacherAssignments,
  assignTeacher,
};
