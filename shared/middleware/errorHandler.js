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

  // Prisma Database Errors — bad or conflicting input is the caller's problem (4xx) with a
  // message naming the field, never a generic 500 that hides what the user must fix.
  if (typeof err.code === 'string' && /^P\d{4}$/.test(err.code)) {
    const fieldsOf = (meta) => {
      const raw = meta?.target || meta?.field_name || meta?.column_name || '';
      const list = Array.isArray(raw) ? raw : String(raw).replace(/\(index\)|_fkey|_key|\(|\)|`/g, ' ').split(/[\s,]+/);
      return list
        .map((f) => f.split('_').filter((p) => p && !/^[A-Z]/.test(p)).join(' ') || f)
        .filter(Boolean)
        .map((f) => f.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Id$/i, '').toLowerCase());
    };
    const fields = fieldsOf(err.meta);
    const named = fields.length ? fields.join(', ') : null;
    switch (err.code) {
      case 'P2002':
        return sendError(res, named ? `A record with this ${named} already exists.` : 'A record with these details already exists.', 409, 'DUPLICATE_ENTRY');
      case 'P2025':
        return sendError(res, 'Record to update/delete was not found.', 404, 'NOT_FOUND');
      case 'P2003':
        return sendError(res, named ? `The selected ${named} does not exist or was removed. Please choose it again.` : 'A selected item does not exist or was removed.', 400, 'INVALID_REFERENCE');
      case 'P2014':
        return sendError(res, 'This change would break a required link to another record.', 409, 'RELATION_VIOLATION');
      case 'P2000':
        return sendError(res, named ? `The value for ${named} is too long.` : 'A value is too long.', 400, 'VALUE_TOO_LONG');
      case 'P2011':
      case 'P2012':
        return sendError(res, named ? `${named} is required.` : 'A required value is missing.', 400, 'VALIDATION_ERROR');
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2023':
        return sendError(res, named ? `The value for ${named} is not valid.` : 'A submitted value is not valid.', 400, 'VALIDATION_ERROR');
      default:
        break;
    }
  }

  // Prisma rejected the shape of the data before it reached the database (e.g. an empty
  // string for a date, a word where a number belongs, an unknown enum value)
  if (err.name === 'PrismaClientValidationError') {
    const lines = String(err.message).split('\n').map((l) => l.trim()).filter(Boolean);
    const reason = lines.reverse().find((l) => /^(Argument|Invalid value|Unknown argument|Expected)/.test(l)) || '';
    const clean = reason.replace(/`/g, '').replace(/\s+/g, ' ').slice(0, 200);
    return sendError(res, clean ? `Invalid input: ${clean}` : 'Some submitted values are not valid.', 400, 'VALIDATION_ERROR');
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
