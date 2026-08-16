/**
 * Authentication Middleware validating Bearer JWT Tokens
 */

const { verifyAccessToken } = require('../auth/jwt');
const { AuthenticationError } = require('../errors/customErrors');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

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
