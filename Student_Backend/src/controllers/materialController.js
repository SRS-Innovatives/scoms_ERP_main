/**
 * Student — Study Materials Controller
 *
 * A subject can be mapped to several classes, so "my materials" is scoped by whether
 * the subject is mapped to the student's own course via SubjectClassMapping.
 */
const { prisma, sendSuccess, NotFoundError, ROLES } = require('../../../shared');
const { studentSubjectWhere } = require('../../../shared/academic/electives');
const { attachFileLinks } = require('../../../shared/media/mediaUrl');

const getMaterials = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student?.courseId) return sendSuccess(res, [], 'Study materials retrieved');

    // Files go out as cacheable download links, not inline base64 (and a data: link
    // can't be opened in a new tab anyway — browsers block it) — shared/media/mediaUrl.js
    const materials = await prisma.studyMaterial.findMany({
      where: { institutionId: req.institutionId, subject: studentSubjectWhere({ id: req.user.studentId, courseId: student.courseId }) /* core subjects + this student's electives */ },
      omit: { fileUrl: true },
      include: { subject: { select: { name: true } }, staff: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    await attachFileLinks(prisma, req, 'material', materials, 'fileUrl');

    return sendSuccess(res, materials, 'Study materials retrieved');
  } catch (err) {
    next(err);
  }
};

/** The student opened (viewed / downloaded) a material — counted once per student per material
 * with first and last time, for the teacher's Download History. Only a material of the student's
 * own subjects counts; a parent viewing it is not counted (it is the student's activity). */
const markOpened = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.PARENT) return sendSuccess(res, { recorded: false }, 'Parent views are not counted');
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { id: true, courseId: true } });
    if (!student?.courseId) throw new NotFoundError('Study material not found');
    const material = await prisma.studyMaterial.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId, subject: studentSubjectWhere(student) },
      select: { id: true },
    });
    if (!material) throw new NotFoundError('Study material not found');

    const now = new Date();
    await prisma.materialDownload.upsert({
      where: { materialId_studentId: { materialId: material.id, studentId: student.id } },
      create: { institutionId: req.institutionId, materialId: material.id, studentId: student.id, firstOpenedAt: now, lastOpenedAt: now },
      update: { openCount: { increment: 1 }, lastOpenedAt: now },
    });
    return sendSuccess(res, { recorded: true }, 'Recorded');
  } catch (err) {
    // two clicks at the same instant on a first open: the second insert loses the race — count it as an update
    if (err?.code === 'P2002') {
      try {
        await prisma.materialDownload.update({
          where: { materialId_studentId: { materialId: req.params.id, studentId: req.user.studentId } },
          data: { openCount: { increment: 1 }, lastOpenedAt: new Date() },
        });
        return sendSuccess(res, { recorded: true }, 'Recorded');
      } catch (e) { return next(e); }
    }
    next(err);
  }
};

module.exports = { getMaterials, markOpened };
