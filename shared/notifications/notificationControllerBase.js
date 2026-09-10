/**
 * Generic Notification Center endpoints — identical logic across all 4 portals (a
 * notification always belongs to exactly one User, regardless of their role), so this is
 * shared rather than reimplemented per backend. Each portal's own authController.js
 * re-exports these under its own route file, same pattern as the shared auth handlers.
 */
const prisma = require('../database/client');
const { sendSuccess } = require('../utils/responseFormatter');

/** Most recent notifications for the logged-in user, newest first. */
const handleGetNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Just the unread count — cheap enough to poll every few seconds for the bell badge
 * without pulling the full list each time. */
const handleGetUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    return sendSuccess(res, { count }, 'Unread count retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const handleMarkNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    // scoped to req.user.id so one user can never mark another user's notification read
    const result = await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    return sendSuccess(res, { updated: result.count > 0 }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

const handleMarkAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return sendSuccess(res, { updated: result.count }, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
};
