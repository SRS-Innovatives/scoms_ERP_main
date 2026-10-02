/**
 * Thin HTTP layer: read the request, call the service, format the response.
 * No Prisma calls here — see service.js.
 */
const { sendSuccess, ValidationError, AuthenticationError } = require('@scoms/shared');
const { registerDevice, unregisterDevice, dispatchToUsers, VALID_PLATFORMS } = require('./service');

const register = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token || !platform) throw new ValidationError('token and platform are required');
    if (!VALID_PLATFORMS.includes(platform)) {
      throw new ValidationError(`platform must be one of: ${VALID_PLATFORMS.join(', ')}`);
    }

    const record = await registerDevice({
      userId: req.user.id,
      institutionId: req.user.institutionId,
      token,
      platform,
    });

    return sendSuccess(res, record, 'Device registered for push notifications');
  } catch (err) {
    next(err);
  }
};

const unregister = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new ValidationError('token is required');

    const result = await unregisterDevice({ userId: req.user.id, token });
    return sendSuccess(res, result, 'Device unregistered');
  } catch (err) {
    next(err);
  }
};

/**
 * Server-to-server only — called by shared/utils/notificationCenter.js from any
 * backend (web or mobile) right after it writes an in-app Notification row, so
 * push delivery piggybacks on every existing notification event with no changes
 * needed at any of those call sites. Authenticated by a shared secret, never by
 * end-user JWT, since there is no end user making this request.
 */
const dispatch = async (req, res, next) => {
  try {
    const secret = req.get('x-internal-secret');
    if (!process.env.INTERNAL_PUSH_SECRET || secret !== process.env.INTERNAL_PUSH_SECRET) {
      throw new AuthenticationError('Invalid internal request');
    }

    const { userIds, title, message, link } = req.body;
    if (!Array.isArray(userIds) || !title || !message) {
      throw new ValidationError('userIds, title and message are required');
    }

    const result = await dispatchToUsers({ userIds, title, message, link });
    return sendSuccess(res, result, 'Push dispatch complete');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, unregister, dispatch };
