/**
 * Standard Application Error Hierarchy for SCOMS Platform
 */

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists or conflict occurred') {
    super(message, 409, 'CONFLICT');
  }
}

class BusinessRuleError extends AppError {
  constructor(message = 'Business rule violation') {
    super(message, 422, 'BUSINESS_RULE_VIOLATION');
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing error', details = {}) {
    super(message, 402, 'PAYMENT_ERROR', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  PaymentError,
};
