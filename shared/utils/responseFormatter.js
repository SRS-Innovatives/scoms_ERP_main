/**
 * Standardized Response Formatter for SCOMS APIs
 */

const sendSuccess = (res, data = null, message = 'Operation successful', statusCode = 200, meta = null) => {
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
