/**
 * Staff — Study Materials Controller
 *
 * No file-storage infrastructure exists in this project, so materials are shared via an
 * external resource link (Google Drive, YouTube, etc.) rather than a real file upload —
 * matches StudyMaterial.fileUrl in the schema, which is a plain URL string.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

/** Subjects this staff member actually teaches — populates the "subject" dropdown. */
const getMySubjects = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      include: { subject: { select: { id: true, name: true } } },
      distinct: ['subjectId'],
    });
    const subjects = mappings.map((m) => ({ id: m.subject.id, name: m.subject.name }));
    return sendSuccess(res, subjects, 'Subjects retrieved');
  } catch (err) {
    next(err);
  }
};

/** Institution-wide library — every staff member's shared materials, most recent first. */
const getMaterials = async (req, res, next) => {
  try {
    const materials = await prisma.studyMaterial.findMany({
      where: { institutionId: req.institutionId },
      include: { subject: { select: { name: true } }, staff: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, materials, 'Study materials retrieved');
  } catch (err) {
    next(err);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const { title, description, subjectId, fileType, fileUrl, fileSize } = req.body;
    if (!title || !subjectId || !fileType || !fileUrl) {
      throw new ValidationError('title, subjectId, fileType and fileUrl are required');
    }

    const mapping = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId } });
    if (!mapping) throw new ValidationError('You are not assigned to teach this subject');

    const material = await prisma.studyMaterial.create({
      data: { institutionId: req.institutionId, staffId: req.user.staffId, subjectId, title, description, fileType, fileUrl, fileSize },
    });

    return sendSuccess(res, material, 'Study material shared with students', 201);
  } catch (err) {
    next(err);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.studyMaterial.findFirst({ where: { id, institutionId: req.institutionId, staffId: req.user.staffId } });
    if (!existing) throw new NotFoundError('Material not found or access denied');

    await prisma.studyMaterial.delete({ where: { id } });
    return sendSuccess(res, null, 'Study material removed');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMySubjects, getMaterials, createMaterial, deleteMaterial };
