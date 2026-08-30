/**
 * Super Admin Announcements Controller
 *
 * Super Admin can broadcast platform-wide (institutionId = null, visible to every
 * institution) or target one specific institution directly.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

const getAnnouncements = async (req, res, next) => {
  try {
    const { institutionId } = req.query;
    const announcements = await prisma.announcement.findMany({
      where: institutionId ? { institutionId } : {},
      include: {
        institution: { select: { name: true, code: true } },
        author: { select: { email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, announcements, 'Announcements retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, institutionId, targetRole, priority } = req.body;

    if (!title || !content) throw new ValidationError('title and content are required');

    if (institutionId) {
      const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
      if (!institution) throw new NotFoundError('Institution not found');
    }

    const announcement = await prisma.announcement.create({
      data: {
        institutionId: institutionId || null,
        authorId: req.user.id,
        title,
        content,
        targetRole: targetRole || 'ALL',
        priority: priority || 'NORMAL',
      },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: institutionId || null,
        userId: req.user.id,
        action: 'ANNOUNCEMENT_CREATED',
        module: 'COMMUNICATION',
        entity: 'Announcement',
        entityId: announcement.id,
        newValues: JSON.stringify({ title, institutionId: institutionId || 'PLATFORM_WIDE' }),
      },
    }).catch(() => {});

    return sendSuccess(res, announcement, 'Announcement published successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Announcement not found');

    await prisma.announcement.delete({ where: { id } });
    return sendSuccess(res, null, 'Announcement deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
