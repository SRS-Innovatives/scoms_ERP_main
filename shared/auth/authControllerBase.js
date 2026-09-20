/**
 * Base Shared Authentication Controller Logic
 */

const prisma = require('../database/client');
const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('./jwt');
const { hashPassword, comparePassword } = require('./password');
const { sendSuccess } = require('../utils/responseFormatter');
const { AuthenticationError, NotFoundError, BusinessRuleError } = require('../errors/customErrors');
const { resolveEnabledModulesForInstitution } = require('../moduleRegistry/resolveModules');

const handleRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    const decoded = verifyRefreshToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new AuthenticationError('Invalid or expired refresh token. Please login again.');
    }

    const payload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      institutionId: storedToken.user.institutionId,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Rotate refresh token
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Tokens refreshed successfully');
  } catch (err) {
    next(err);
  }
};

const handleLogout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const handleGetMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        mobile: true,
        admissionNumber: true,
        employeeCode: true,
        userCode: true,
        avatar: true,
        role: true,
        status: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            logo: true,
            modules: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            city: true,
            district: true,
            state: true,
            pincode: true,
            affiliation: true,
            board: true,
            university: true,
            principalName: true,
            establishedYear: true,
            affiliatedUniversityId: true,
            affiliatedUniversity: { select: { id: true, name: true, code: true } },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      throw new NotFoundError('User profile not found');
    }

    // Resolve the institution's enabled optional modules so the frontend can gate
    // navigation without duplicating the default/legacy-institution fallback logic.
    // Goes through the same dual-path resolver requireModule() uses (Phase 1 Module
    // Registry, with an identical-output fallback to the legacy Institution.modules
    // array) so nav visibility and route access can never disagree.
    const enrichedUser = user.institution
      ? {
          ...user,
          institution: {
            ...user.institution,
            enabledModules: await resolveEnabledModulesForInstitution(user.institution),
          },
        }
      : user;

    return sendSuccess(res, enrichedUser, 'Authenticated user context retrieved');
  } catch (err) {
    next(err);
  }
};

const handleChangePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      throw new BusinessRuleError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Lets any authenticated user (any role, any portal) upload/replace or remove their own
 * profile photo — shared across all four backends so the behavior is identical everywhere.
 * `avatar` is a base64 data URI (client-converted, same pattern as the institution logo);
 * pass an empty string to remove the current photo. */
const handleUpdateProfile = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (avatar !== undefined && avatar !== '' && !/^data:image\/(png|jpeg|jpg);base64,/.test(avatar)) {
      throw new BusinessRuleError('Profile photo must be a PNG or JPEG image');
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatar === '' ? null : avatar },
      select: { id: true, avatar: true },
    });

    return sendSuccess(res, user, 'Profile photo updated successfully');
  } catch (err) {
    next(err);
  }
};

const { handleUnifiedLogin } = require('./unifiedAuth');

module.exports = {
  handleRefreshToken,
  handleLogout,
  handleGetMe,
  handleChangePassword,
  handleUpdateProfile,
  handleUnifiedLogin,
};
