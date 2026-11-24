/**
 * The notifications block every app dashboard shows: unread count + the latest few,
 * selecting only what the list renders. Used by both /dashboard/summary endpoints.
 */
const prisma = require('../database/client');

const notificationSummary = async (userId, take = 3) => {
  const [unread, recent] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, title: true, message: true, type: true, link: true, isRead: true, createdAt: true },
    }),
  ]);
  return { unread, recent };
};

module.exports = { notificationSummary };
