/**
 * Real forgot-password OTP flow, shared by all 4 portals' login pages — the same
 * find-user-by-identifier lookup used by handleUnifiedLogin, then a 6-digit OTP emailed
 * via the existing (simulated-in-dev) notification pipeline.
 */
const prisma = require('../database/client');
const { hashPassword } = require('./password');
const { sendSuccess } = require('../utils/responseFormatter');
const { AuthenticationError, ValidationError } = require('../errors/customErrors');
const { sendEmailNotification } = require('../utils/notifications');

const OTP_EXPIRY_MINUTES = 10;
const GENERIC_MESSAGE = 'If an account matches that identifier, a verification code has been sent to its registered email.';

const findUserByIdentifier = (identifier) =>
  prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { mobile: identifier },
        { admissionNumber: identifier },
        { employeeCode: identifier },
      ],
    },
  });

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/** Step 1 — request a code. Always responds with the same generic message, whether or
 * not the account exists, so this endpoint can't be used to enumerate real accounts. */
const handleForgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) throw new ValidationError('identifier is required');

    const user = await findUserByIdentifier(identifier);
    if (user) {
      const otpCode = generateOtp();
      await prisma.passwordResetOtp.create({
        data: { userId: user.id, otpCode, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000) },
      });

      if (user.email) {
        await sendEmailNotification({
          to: user.email,
          subject: 'SCOMS Password Reset Code',
          text: `Your SCOMS password reset code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
          institutionId: user.institutionId,
          purpose: 'PASSWORD_RESET',
        }).catch(() => {});
      }
    }

    return sendSuccess(res, null, GENERIC_MESSAGE);
  } catch (err) {
    next(err);
  }
};

/** Finds the user's latest usable OTP row matching the submitted code, or throws. */
const requireValidOtp = async (identifier, otp) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) throw new AuthenticationError('Invalid identifier or code.');

  const record = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, otpCode: otp, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new AuthenticationError('Invalid or expired code.');

  return { user, record };
};

/** Step 2 — verify the code without consuming it, so the UI can advance to the "new
 * password" step before the user has actually chosen one. */
const handleVerifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) throw new ValidationError('identifier and otp are required');

    await requireValidOtp(identifier, otp);
    return sendSuccess(res, null, 'Code verified.');
  } catch (err) {
    next(err);
  }
};

/** Step 3 — re-validates the same code and actually changes the password, consuming it. */
const handleResetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) throw new ValidationError('identifier, otp and newPassword are required');
    if (newPassword.length < 8) throw new ValidationError('newPassword must be at least 8 characters');

    const { user, record } = await requireValidOtp(identifier, otp);

    const hashedPassword = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
      prisma.passwordResetOtp.update({ where: { id: record.id }, data: { used: true } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }), // force re-login everywhere
    ]);

    return sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
};

module.exports = { handleForgotPassword, handleVerifyOtp, handleResetPassword };
