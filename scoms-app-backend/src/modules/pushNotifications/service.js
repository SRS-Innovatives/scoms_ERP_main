/**
 * All Prisma access for device-token registration lives here — controllers never
 * touch `prisma` directly, so the query logic can be read/tested/changed in one
 * place regardless of which route (student or staff) called it.
 */
const prisma = require('../../database/client');
const { sendPushToTokens } = require('./sender');

const VALID_PLATFORMS = ['ANDROID', 'IOS'];

function assertValidPlatform(platform) {
  if (!VALID_PLATFORMS.includes(platform)) {
    throw new Error(`platform must be one of: ${VALID_PLATFORMS.join(', ')}`);
  }
}

/** Upserts on the unique token so a device re-registering (app reopened) or a token
 * moving to a different account (phone re-logged-in as someone else) always ends up
 * owned by the currently authenticated user, never left pointing at the old one. */
async function registerDevice({ userId, institutionId, token, platform }) {
  assertValidPlatform(platform);

  return prisma.deviceToken.upsert({
    where: { token },
    update: { userId, institutionId: institutionId ?? null, platform, lastSeenAt: new Date() },
    create: { userId, institutionId: institutionId ?? null, token, platform },
    select: { id: true, platform: true, lastSeenAt: true },
  });
}

/** Scoped to userId so one user can never remove another user's device token by
 * guessing/replaying its value. */
async function unregisterDevice({ userId, token }) {
  const result = await prisma.deviceToken.deleteMany({ where: { token, userId } });
  return { removed: result.count > 0 };
}

/** Looks up every device registered to these users and sends the same push to all
 * of them, then prunes any token FCM reports as dead/unregistered — the only place
 * that ever deletes a token on the server's own initiative (registration/logout
 * only ever touch the caller's own token). Called from the internal dispatch route
 * that shared/utils/notificationCenter.js hits after writing the in-app Notification
 * row, so every existing pushNotification()/pushNotificationToMany() call site
 * across every backend gets real push delivery for free, with no code duplicated
 * there and no dependency on this folder's Prisma client from outside this folder. */
async function dispatchToUsers({ userIds, title, message, link }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return { recipients: 0 };

  const devices = await prisma.deviceToken.findMany({
    where: { userId: { in: ids } },
    select: { token: true },
  });
  if (!devices.length) return { recipients: 0 };

  const tokens = devices.map((d) => d.token);
  const result = await sendPushToTokens(tokens, { title, body: message, data: link ? { link } : {} });

  if (result.invalidTokens.length) {
    await prisma.deviceToken.deleteMany({ where: { token: { in: result.invalidTokens } } });
  }

  return { recipients: tokens.length, ...result };
}

module.exports = { registerDevice, unregisterDevice, dispatchToUsers, VALID_PLATFORMS };
