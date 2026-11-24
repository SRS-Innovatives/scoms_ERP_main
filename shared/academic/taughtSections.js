/**
 * The section ids a staff member teaches (SubjectTeacherMapping), cached.
 *
 * Messages (every list / open / send) and PTM notes (student list / save) all ask this; it
 * only changes when the timetable office edits the mappings, and that write drops the cache
 * (shared/utils/hotCache.js DEPENDENCIES.SubjectTeacherMapping). Other processes see the
 * change within HOT_CACHE_TTL_MS.
 */
const prisma = require('../database/client');
const { cached } = require('../utils/hotCache');

const getTaughtSectionIds = (staffId) => {
  if (!staffId) return Promise.resolve([]);
  return cached('teacherSections', staffId, async () => {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId, sectionId: { not: null } },
      select: { sectionId: true },
      distinct: ['sectionId'],
    });
    return mappings.map((m) => m.sectionId);
  });
};

module.exports = { getTaughtSectionIds };
