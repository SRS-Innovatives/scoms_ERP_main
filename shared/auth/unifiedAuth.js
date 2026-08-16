/**
 * Centralized Unified Authentication Handler for SCOMS ERP
 * Supports single multi-role login for Super Admin, Institute Admin, Staff, Student & Parent
 */

const prisma = require('../database/client');
const { generateAccessToken, generateRefreshToken } = require('./jwt');
const { comparePassword } = require('./password');
const { sendSuccess } = require('../utils/responseFormatter');
const { AuthenticationError } = require('../errors/customErrors');
const { ROLES } = require('../constants/roles');

const handleUnifiedLogin = async (req, res, next) => {
  try {
    const { identifier, email, admissionNumber, employeeCode, password } = req.body;

    const searchInput = identifier || email || admissionNumber || employeeCode;
    if (!searchInput || !password) {
      throw new AuthenticationError('Please provide a valid login identifier and password');
    }

    // Build query to match email, mobile, admissionNumber or employeeCode
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: searchInput },
          { mobile: searchInput },
          { admissionNumber: searchInput },
          { employeeCode: searchInput },
        ],
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            logo: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            rollNumber: true,
            course: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        staff: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials. Account not found.');
    }

    // Verify password hash
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid credentials. Password incorrect.');
    }

    // Map role to standard module redirect URL
    let defaultRedirect = '/student/dashboard';
    if ([ROLES.SUPER_ADMIN, ROLES.PLATFORM_ADMIN].includes(user.role)) {
      defaultRedirect = '/super-admin/dashboard';
    } else if (user.role === ROLES.INSTITUTE_ADMIN) {
      defaultRedirect = '/admin/dashboard';
    } else if ([ROLES.TEACHER, ROLES.STAFF, ROLES.HOD, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL, ROLES.ACCOUNTANT, ROLES.LIBRARIAN, ROLES.TRANSPORT_MANAGER, ROLES.HOSTEL_WARDEN, ROLES.EXAM_ADMIN, ROLES.PLACEMENT_OFFICER].includes(user.role)) {
      defaultRedirect = '/staff/dashboard';
    } else if ([ROLES.STUDENT, ROLES.PARENT].includes(user.role)) {
      defaultRedirect = '/student/dashboard';
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      studentId: user.student ? user.student.id : undefined,
      staffId: user.staff ? user.staff.id : undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login timestamp asynchronously
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          admissionNumber: user.admissionNumber,
          employeeCode: user.employeeCode,
          role: user.role,
          status: user.status,
          institutionId: user.institutionId,
          institutionName: user.institution ? user.institution.name : null,
          student: user.student || null,
          staff: user.staff || null,
        },
        accessToken,
        refreshToken,
        redirectUrl: defaultRedirect,
      },
      `${user.role} login successful`
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleUnifiedLogin,
};
