/**
 * Authentication Middleware validating Bearer JWT Tokens
 *
 * A token issued for a session (it carries `sid`) is only accepted while that session still
 * exists — so a session the Super Admin revoked, or one signed out, stops working
 * (shared/auth/sessions.js; cached, at most one tiny query per session per minute). Tokens
 * from before sessions carried a `sid` are accepted until they expire.
 */

const { verifyAccessToken } = require('../auth/jwt');
const { isSessionActive } = require('../auth/sessions');
const { AuthenticationError } = require('../errors/customErrors');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (decoded.sid && !(await isSessionActive(decoded.sid))) {
      throw new AuthenticationError('Your session was signed out. Please log in again.');
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Session expired. Please log in again.'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid authentication token.'));
    }
    next(err);
  }
};

module.exports = requireAuth;
