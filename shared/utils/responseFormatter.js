/**
 * Standardized Response Formatter for SCOMS APIs
 */

const { rewriteAvatars } = require('../media/mediaUrl');

const sendSuccess = (res, data = null, message = 'Operation successful', statusCode = 200, meta = null) => {
  // Profile photos and institution logos go out as short cacheable URLs, never as inline base64 (media/mediaUrl.js)
  rewriteAvatars(data, res.req);
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

const sendError = (res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
};

const sendPaginated = (res, data, page, limit, total, message = 'Data retrieved successfully') => {
  rewriteAvatars(data, res.req);
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};
