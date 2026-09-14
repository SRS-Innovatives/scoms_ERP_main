/**
 * Rate limiting for auth-sensitive endpoints.
 *
 * Before this, /auth/login, /auth/forgot-password, /auth/verify-otp and
 * /auth/reset-password had zero request throttling anywhere in the platform. The OTP
 * codes used for password reset are 6 digits (1,000,000 possibilities) with a 10-minute
 * expiry and no lockout — and the "identifier" they're keyed to (admission number,
 * employee code) is a predictable, non-secret, sequential value, not something an
 * attacker needs to guess. Without a limiter, a scripted attacker could realistically
 * exhaust the whole OTP space for a known account inside its expiry window.
 *
 * These limiters are IP-based (the standard first line of defense) and deliberately
 * generous for real users — they only engage under actual automated abuse, so normal
 * login/reset flows are completely unaffected.
 */
const rateLimit = require('express-rate-limit');

const jsonRateLimitHandler = (req, res /* , next */) => {
  res.status(429).json({
    success: false,
    message: 'Too many attempts. Please wait a few minutes and try again.',
    code: 'RATE_LIMITED',
    errors: [],
  });
};

/** Login: 10 attempts per 15 minutes per IP — enough for a real user fumbling a
 * password a few times, tight enough to block credential-stuffing/brute force. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** OTP request/verify/reset: 5 per 15 minutes per IP. This is the critical one — it's
 * what actually closes the OTP brute-force window described above. */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** Public pre-admission form submissions: 20 per hour per IP. This endpoint is reachable
 * from the open internet (an institution's own public website), so it needs its own
 * throttle independent of API-key validity — generous enough for a real busy admission
 * season, tight enough to block a scripted flood. */
const publicSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

module.exports = { loginLimiter, otpLimiter, publicSubmissionLimiter };
