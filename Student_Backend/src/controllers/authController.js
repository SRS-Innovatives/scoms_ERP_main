/**
 * Student Portal Auth Controller
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
  return handleUnifiedLogin(req, res, next, [ROLES.STUDENT, ROLES.PARENT]);
};

module.exports = {
  login,
  refreshToken: handleRefreshToken,
  logout: handleLogout,
  getMe: handleGetMe,
  changePassword: handleChangePassword,
  updateProfile: handleUpdateProfile,
};
