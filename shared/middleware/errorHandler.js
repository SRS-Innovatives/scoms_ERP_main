/**
 * Centralized Error Handler Middleware
 */

const logger = require('../utils/logger');
const { sendError } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    code: err.code || 'INTERNAL_ERROR',
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode, err.code, err.errors);
  }

  // Syntax or payload errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Malformed JSON payload', 400, 'INVALID_JSON');
  }

  // Prisma Database Errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return sendError(res, 'A unique constraint error occurred. Record already exists.', 409, 'DUPLICATE_ENTRY');
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record to update/delete was not found.', 404, 'NOT_FOUND');
    }
  }

  // Unhandled standard operational/server error
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
};

module.exports = errorHandler;
