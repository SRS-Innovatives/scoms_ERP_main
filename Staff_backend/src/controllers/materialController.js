/**
 * Staff — Study Materials Controller
 *
 * No file-storage infrastructure exists in this project, so materials are shared via an
 * external resource link (Google Drive, YouTube, etc.) rather than a real file upload —
 * matches StudyMaterial.fileUrl in the schema, which is a plain URL string.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');
const { attachFileLinks } = require('../../../shared/media/mediaUrl');

const FILE_TYPES = ['PDF', 'PPT', 'DOC', 'VIDEO', 'LINK']; // same list as the Staff portal's upload page

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
    // Files go out as cacheable download links, not inline base64 (and a data: link
    // can't be opened in a new tab anyway — browsers block it) — shared/media/mediaUrl.js
    const materials = await prisma.studyMaterial.findMany({
      where: { institutionId: req.institutionId },
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

const createMaterial = async (req, res, next) => {
  try {
    const { title, description, subjectId, fileType, fileUrl, fileSize } = req.body;
    if (!title || !subjectId || !fileType || !fileUrl) {
      throw new ValidationError('title, subjectId, fileType and fileUrl are required');
    }
    if (!FILE_TYPES.includes(fileType)) throw new ValidationError(`fileType must be one of ${FILE_TYPES.join(', ')}`);
    if (String(title).length > 200) throw new ValidationError('title can be at most 200 characters');
    // an uploaded file (data URI, from the web portal) or a web link — nothing else is openable
    if (!/^(https?:\/\/|data:)/i.test(String(fileUrl))) throw new ValidationError('fileUrl must be an http(s) link or an uploaded file');

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

/**
 * Prisma `where` on Student: the active students who can see a material of `subjectId` — every
 * student of a class the subject is mapped to as CORE, plus the students who chose it where it
 * is an ELECTIVE (the same rule the Student portal's material list uses). null = nobody known.
 */
const audienceWhere = async (institutionId, subjectId) => {
  if (!subjectId) return null;
  const mappings = await prisma.subjectClassMapping.findMany({ where: { subjectId }, select: { courseId: true, isElective: true } });
  if (mappings.length === 0) return null;
  return {
    institutionId,
    status: 'ACTIVE',
    OR: mappings.map((m) => (m.isElective ? { courseId: m.courseId, electives: { some: { subjectId } } } : { courseId: m.courseId })),
  };
};

const STUDENT_SELECT = { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true, section: { select: { name: true } } };

/** Download History — every material this teacher shared, with how many of its students opened it. */
const getDownloadSummary = async (req, res, next) => {
  try {
    const materials = await prisma.studyMaterial.findMany({
      where: { institutionId: req.institutionId, staffId: req.user.staffId },
      select: { id: true, title: true, fileType: true, subjectId: true, createdAt: true, subject: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const ids = materials.map((m) => m.id);
    const stats = ids.length
      ? await prisma.materialDownload.groupBy({
        by: ['materialId'],
        where: { materialId: { in: ids } },
        _count: { _all: true },
        _sum: { openCount: true },
        _max: { lastOpenedAt: true },
      })
      : [];
    const byId = new Map(stats.map((s) => [s.materialId, s]));

    // audience size per subject (several materials usually share a subject)
    // one count per distinct subject, all in parallel (was one after another)
    const subjectIds = [...new Set(materials.map((m) => m.subjectId).filter(Boolean))];
    const counts = await Promise.all(subjectIds.map(async (subjectId) => {
      const where = await audienceWhere(req.institutionId, subjectId);
      return [subjectId, where ? await prisma.student.count({ where }) : null];
    }));
    const audience = new Map(counts);

    const rows = materials.map((m) => {
      const s = byId.get(m.id);
      return {
        id: m.id,
        title: m.title,
        fileType: m.fileType,
        subject: m.subject?.name || null,
        sharedAt: m.createdAt,
        students: audience.get(m.subjectId) ?? null,
        openedBy: s?._count._all || 0,
        totalOpens: s?._sum.openCount || 0,
        lastOpenedAt: s?._max.lastOpenedAt || null,
      };
    });
    return sendSuccess(res, rows, 'Download history retrieved');
  } catch (err) {
    next(err);
  }
};

/** One material: who opened it (how often, first / last time) and which of its students haven't yet. */
const getMaterialDownloads = async (req, res, next) => {
  try {
    const material = await prisma.studyMaterial.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId, staffId: req.user.staffId },
      select: { id: true, title: true, subjectId: true, createdAt: true, subject: { select: { name: true } } },
    });
    if (!material) throw new NotFoundError('Material not found or access denied');

    const downloads = await prisma.materialDownload.findMany({
      where: { materialId: material.id },
      select: { openCount: true, firstOpenedAt: true, lastOpenedAt: true, student: { select: STUDENT_SELECT } },
      orderBy: { lastOpenedAt: 'desc' },
    });
    const where = await audienceWhere(req.institutionId, material.subjectId);
    const notOpened = where
      ? await prisma.student.findMany({
        where: { ...where, id: { notIn: downloads.map((d) => d.student.id) } },
        select: STUDENT_SELECT,
        orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
        take: 500,
      })
      : [];

    return sendSuccess(res, {
      material: { id: material.id, title: material.title, subject: material.subject?.name || null, sharedAt: material.createdAt },
      opened: downloads.map((d) => ({ ...d.student, openCount: d.openCount, firstOpenedAt: d.firstOpenedAt, lastOpenedAt: d.lastOpenedAt })),
      notOpened,
    }, 'Material download history retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMySubjects, getMaterials, createMaterial, deleteMaterial, getDownloadSummary, getMaterialDownloads };
