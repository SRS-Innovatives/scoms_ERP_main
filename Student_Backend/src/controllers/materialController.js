/**
 * Student — Study Materials Controller
 *
 * Subjects belong to a Course (not directly to a Section), so "my materials" is scoped
 * by the student's own course — every subject taught within their course is visible.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getMaterials = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Study materials retrieved');

    const materials = await prisma.studyMaterial.findMany({
      where: { institutionId: req.institutionId, subject: { courseId: student.courseId } },
      include: { subject: { select: { name: true } }, staff: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, materials, 'Study materials retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMaterials };
