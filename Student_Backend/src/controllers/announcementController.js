/**
 * Student Announcements Controller — read-only.
 *
 * A student sees: platform-wide broadcasts, plus their own institution's announcements
 * targeted at ALL or STUDENTS, further narrowed to their own course/section when the
 * announcement specifies one (an announcement with no course/section set applies to
 * every student in the institution).
 */
const { prisma, sendSuccess, NotFoundError, findList } = require('../../../shared');

const getAnnouncements = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      select: { courseId: true, sectionId: true },
    });
    if (!student) throw new NotFoundError('Student profile not found');

    const { rows: announcements, meta: listMeta } = await findList(prisma.announcement, {
      where: {
        OR: [{ institutionId: req.institutionId }, { institutionId: null }],
        targetRole: { in: ['ALL', 'STUDENTS'] },
        AND: [
          { OR: [{ targetCourseId: null }, { targetCourseId: student.courseId }] },
          { OR: [{ targetSectionId: null }, { targetSectionId: student.sectionId }] },
        ],
      },
      include: {
        author: { select: { email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    }, req);
    return sendSuccess(res, announcements, 'Announcements retrieved successfully', 200, listMeta);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
};
