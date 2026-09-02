/**
 * Institute Admin Announcements Controller
 *
 * Institute Admin sees platform-wide broadcasts (institutionId = null) plus everything
 * posted for their own institution, and can target a specific course/section/role.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { OR: [{ institutionId: req.institutionId }, { institutionId: null }] },
      include: {
        author: { select: { email: true, role: true } },
        targetCourse: { select: { name: true } },
        targetSection: { select: { name: true } },
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
    const { title, content, targetRole, targetCourseId, targetSectionId, priority } = req.body;

    if (!title || !content) throw new ValidationError('title and content are required');

    if (targetCourseId) {
      const course = await prisma.course.findFirst({ where: { id: targetCourseId, institutionId: req.institutionId } });
      if (!course) throw new NotFoundError('Target course not found or access denied');
    }
    if (targetSectionId) {
      const section = await prisma.section.findFirst({
        where: { id: targetSectionId, semester: { course: { institutionId: req.institutionId } } },
      });
      if (!section) throw new NotFoundError('Target section not found or access denied');
    }

    const announcement = await prisma.announcement.create({
      data: {
        institutionId: req.institutionId,
        authorId: req.user.id,
        title,
        content,
        targetRole: targetRole || 'ALL',
        targetCourseId: targetCourseId || null,
        targetSectionId: targetSectionId || null,
        priority: priority || 'NORMAL',
      },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: req.institutionId,
        userId: req.user.id,
        action: 'ANNOUNCEMENT_CREATED',
        module: 'COMMUNICATION',
        entity: 'Announcement',
        entityId: announcement.id,
        newValues: JSON.stringify({ title, targetRole }),
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
    const existing = await prisma.announcement.findFirst({ where: { id, institutionId: req.institutionId } });
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
