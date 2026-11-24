/**
 * Staff Announcements Controller
 *
 * Staff can read notices meant for them (or everyone), and post class/section notices
 * of their own — typically targeted at students in a specific course/section.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError, findList } = require('../../../shared');

const getAnnouncements = async (req, res, next) => {
  try {
    const { rows: announcements, meta: listMeta } = await findList(prisma.announcement, {
      // notices for staff / everyone, plus the ones this staff member posted themselves
      // (a class notice to STUDENTS used to vanish from its own author's list)
      where: {
        AND: [
          { OR: [{ institutionId: req.institutionId }, { institutionId: null }] },
          { OR: [{ targetRole: { in: ['ALL', 'STAFF'] } }, { authorId: req.user.id }] },
        ],
      },
      include: {
        author: { select: { email: true, role: true } },
        targetCourse: { select: { name: true } },
        targetSection: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }, req);
    return sendSuccess(res, announcements, 'Announcements retrieved successfully', 200, listMeta);
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
        targetRole: targetRole || 'STUDENTS',
        targetCourseId: targetCourseId || null,
        targetSectionId: targetSectionId || null,
        priority: priority || 'NORMAL',
      },
    });

    return sendSuccess(res, announcement, 'Announcement published successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
};
