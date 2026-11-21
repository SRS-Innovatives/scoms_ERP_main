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
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// the limits in force — also shown read-only on Super Admin → API Management
const RATE_LIMITS = {
  login: { label: 'Sign-in attempts', windowMs: 15 * 60 * 1000, max: 10, scope: 'per IP address, every portal' },
  otp: { label: 'Password-reset codes (request / verify / reset)', windowMs: 15 * 60 * 1000, max: 5, scope: 'per IP address' },
  publicFormSchema: { label: 'Public admission form — field list', windowMs: 60 * 60 * 1000, max: 600, scope: 'per IP address' },
  publicSubmission: { label: 'Public admission form submissions & fee payment', windowMs: 60 * 60 * 1000, max: 120, scope: 'per IP address + institution API key' },
};

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
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** OTP request/verify/reset: 5 per 15 minutes per IP. This is the critical one — it's
 * what actually closes the OTP brute-force window described above. */
const otpLimiter = rateLimit({
  windowMs: RATE_LIMITS.otp.windowMs,
  max: RATE_LIMITS.otp.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** Public pre-admission field list (GET /form-schema): read-only and cacheable, and a school
 * website server may fetch it on every page view — so a generous 600/hour per IP. */
const publicFormSchemaLimiter = rateLimit({
  windowMs: RATE_LIMITS.publicFormSchema.windowMs,
  max: RATE_LIMITS.publicFormSchema.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** Public pre-admission submissions and fee payment: 120/hour per IP + API key. A school that
 * posts from its own website server sends every applicant from ONE IP, so a plain per-IP limit
 * of 20 blocked a busy admission day; keying on IP + key gives each institution its own bucket
 * and still stops a scripted flood from any one source. */
const publicSubmissionLimiter = rateLimit({
  windowMs: RATE_LIMITS.publicSubmission.windowMs,
  max: RATE_LIMITS.publicSubmission.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] || req.body?.apiKey || req.query?.apiKey || '';
    return `${ipKeyGenerator(req.ip || '')}|${String(apiKey).slice(0, 100)}`;
  },
  handler: jsonRateLimitHandler,
});

module.exports = { loginLimiter, otpLimiter, publicFormSchemaLimiter, publicSubmissionLimiter, RATE_LIMITS };
