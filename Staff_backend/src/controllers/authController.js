/**
 * Staff Portal Auth Controller
 */

const {
  prisma,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  sendSuccess,
  AuthenticationError,
  ROLES,
  handleUnifiedLogin,
} = require('../../../shared');
const {
  handleRefreshToken,
  handleLogout,
  handleGetMe,
  handleChangePassword,
  handleUpdateProfile,
} = require('../../../shared/auth/authControllerBase');

const login = async (req, res, next) => {
  return handleUnifiedLogin(req, res, next, [
    ROLES.PRINCIPAL,
    ROLES.VICE_PRINCIPAL,
    ROLES.HOD,
    ROLES.TEACHER,
    ROLES.STAFF,
    ROLES.ACCOUNTANT,
    ROLES.LIBRARIAN,
    ROLES.TRANSPORT_MANAGER,
    ROLES.HOSTEL_WARDEN,
    ROLES.EXAM_ADMIN,
    ROLES.PLACEMENT_OFFICER,
  ]);
};

module.exports = {
  login,
  refreshToken: handleRefreshToken,
  logout: handleLogout,
  getMe: handleGetMe,
  changePassword: handleChangePassword,
  updateProfile: handleUpdateProfile,
};
