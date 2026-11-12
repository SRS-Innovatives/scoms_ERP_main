/**
 * Backend-side access to an institution's resolved academic structure. The institutionId
 * must always come from the authenticated request (req.institutionId), never the body.
 */
const prisma = require('../database/client');
const { NotFoundError, BusinessRuleError } = require('../errors/customErrors');
const { resolveAcademicStructure, isLevelEnabled } = require('./academicStructure');

const getInstitutionAcademicStructure = async (institutionId) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { type: true, academicConfig: true },
  });
  if (!institution) throw new NotFoundError('Institution not found');
  return resolveAcademicStructure(institution.type, institution.academicConfig);
};

/** Rejects creating/linking records for a hierarchy level this institution doesn't use
 * (e.g. a Program in a school that hasn't enabled programs). Existing rows are untouched. */
const assertLevelEnabled = async (institutionId, level) => {
  const structure = await getInstitutionAcademicStructure(institutionId);
  if (!isLevelEnabled(structure, level)) {
    throw new BusinessRuleError(
      `${structure.labels[level] || level} is not part of this institution's academic structure. Ask your platform administrator to enable it.`
    );
  }
  return structure;
};

// Report/certificate definitions are seeded once, platform-wide, with generic labels
// ("Course", "Section"...). These map their standard academic fieldKeys to a level so each
// institution sees its own terms ("Standard", "Term"...).
const FIELD_KEY_LEVELS = {
  faculty: 'faculty', facultyId: 'faculty',
  department: 'department', departmentId: 'department',
  program: 'program', programId: 'program',
  course: 'course', courseId: 'course', class: 'course', classId: 'course', className: 'course',
  batch: 'batch', batchId: 'batch',
  semester: 'semester', semesterId: 'semester', yearSem: 'semester',
  section: 'section', sectionId: 'section',
  academicYear: 'academicYear', academicYearId: 'academicYear',
};
// Only these stock wordings are replaced — a label an admin customised is left as-is
const GENERIC_LABELS = new Set([
  'faculty', 'school', 'department', 'program', 'programme', 'course', 'class', 'course / class', 'class / course',
  'batch', 'semester', 'term', 'year / semester', 'year/semester', 'year / sem', 'section', 'academic year',
]);

/** Returns `items` (filters/columns/fields with fieldKey + label) relabelled with the
 * institution's own academic terms. Never throws — falls back to the original labels. */
const localizeAcademicLabels = async (items, institutionId) => {
  if (!Array.isArray(items) || items.length === 0) return items;
  let structure;
  try {
    structure = await getInstitutionAcademicStructure(institutionId);
  } catch {
    return items;
  }
  return items.map((item) => {
    const level = FIELD_KEY_LEVELS[item.fieldKey];
    if (!level || typeof item.label !== 'string' || !GENERIC_LABELS.has(item.label.trim().toLowerCase())) return item;
    return { ...item, label: structure.labels[level] || item.label };
  });
};

module.exports = { getInstitutionAcademicStructure, assertLevelEnabled, localizeAcademicLabels };
