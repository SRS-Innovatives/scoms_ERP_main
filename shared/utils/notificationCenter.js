/**
 * In-App Notification Center — the real backing store for every portal's bell icon.
 * Distinct from utils/notifications.js (which sends outbound email/SMS/WhatsApp); this
 * writes rows to the Notification table that a portal's own logged-in user reads back via
 * GET /notifications. Every call site names a real event (admission created, homework
 * posted, absence marked, ticket opened, ...) — never a fabricated placeholder.
 */
const prisma = require('../database/client');
const logger = require('./logger');

/** Create one notification for one user. Never throws into the caller's own flow — a
 * notification failing to write must not roll back or block the real action that
 * triggered it (e.g. admission creation should still succeed even if this fails). */
const pushNotification = async ({ userId, institutionId = null, title, message, type = null, link = null }) => {
  try {
    if (!userId || !title || !message) return null;
    return await prisma.notification.create({
      data: { userId, institutionId, title, message, type, link },
    });
  } catch (err) {
    logger.error('Failed to push notification:', err);
    return null;
  }
};

/** Same event, fanned out to many recipients at once (e.g. every student in a section,
 * every Super Admin on the platform) — one query, one insert batch. */
const pushNotificationToMany = async ({ userIds, institutionId = null, title, message, type = null, link = null }) => {
  try {
    const ids = [...new Set((userIds || []).filter(Boolean))];
    if (ids.length === 0 || !title || !message) return { count: 0 };
    return await prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, institutionId, title, message, type, link })),
    });
  } catch (err) {
    logger.error('Failed to push notifications to many:', err);
    return { count: 0 };
  }
};

module.exports = { pushNotification, pushNotificationToMany };
