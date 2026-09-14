/**
 * Student — Study Materials Controller
 *
 * A subject can be mapped to several classes, so "my materials" is scoped by whether
 * the subject is mapped to the student's own course via SubjectClassMapping.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getMaterials = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Study materials retrieved');

    const materials = await prisma.studyMaterial.findMany({
      where: { institutionId: req.institutionId, subject: { classMappings: { some: { courseId: student.courseId } } } },
      include: { subject: { select: { name: true } }, staff: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, materials, 'Study materials retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMaterials };
