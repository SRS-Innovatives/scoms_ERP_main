/**
 * Super Admin Auth Controller
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
} = require('../../../shared/auth/authControllerBase');

const login = async (req, res, next) => {
  return handleUnifiedLogin(req, res, next, [ROLES.SUPER_ADMIN, ROLES.PLATFORM_ADMIN]);
};

module.exports = {
  login,
  refreshToken: handleRefreshToken,
  logout: handleLogout,
  getMe: handleGetMe,
  changePassword: handleChangePassword,
};
