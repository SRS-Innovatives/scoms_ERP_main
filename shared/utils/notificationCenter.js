/**
 * In-App Notification Center — the real backing store for every portal's bell icon.
 * Distinct from utils/notifications.js (which sends outbound email/SMS/WhatsApp); this
 * writes rows to the Notification table that a portal's own logged-in user reads back via
 * GET /notifications. Every call site names a real event (admission created, homework
 * posted, absence marked, ticket opened, ...) — never a fabricated placeholder.
 */
const prisma = require('../database/client');
const logger = require('./logger');

/**
 * Fires push delivery for a notification that was just written, by calling the mobile
 * gateway's own /internal/push/dispatch route (server-to-server, shared-secret
 * authenticated). The DeviceToken table intentionally lives only in
 * scoms-app-backend's own Prisma schema/client — this stays a plain HTTP call rather
 * than a direct query, so nothing here needs that model or its client. Fire-and-forget:
 * never awaited by the caller, never throws, and a failure here never rolls back or
 * blocks the in-app Notification row that was already written.
 */
const dispatchPush = ({ userIds, title, message, link }) => {
  const secret = process.env.INTERNAL_PUSH_SECRET;
  if (!secret) return; // push dispatch not configured — in-app notification still wrote fine

  const baseUrl = process.env.MOBILE_BACKEND_INTERNAL_URL || 'http://localhost:5005';

  fetch(`${baseUrl}/internal/push/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
    body: JSON.stringify({ userIds, title, message, link }),
  }).catch((err) => {
    logger.error('Push dispatch call failed (in-app notification was still saved):', err.message);
  });
};

/** Create one notification for one user. Never throws into the caller's own flow — a
 * notification failing to write must not roll back or block the real action that
 * triggered it (e.g. admission creation should still succeed even if this fails). */
const pushNotification = async ({ userId, institutionId = null, title, message, type = null, link = null }) => {
  try {
    if (!userId || !title || !message) return null;
    const notification = await prisma.notification.create({
      data: { userId, institutionId, title, message, type, link },
    });
    dispatchPush({ userIds: [userId], title, message, link });
    return notification;
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
    const result = await prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, institutionId, title, message, type, link })),
    });
    dispatchPush({ userIds: ids, title, message, link });
    return result;
  } catch (err) {
    logger.error('Failed to push notifications to many:', err);
    return { count: 0 };
  }
};

module.exports = { pushNotification, pushNotificationToMany };
