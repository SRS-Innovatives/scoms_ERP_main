/**
 * Browser-side accessors for an institution's academic structure, shared by the Institute
 * Admin, Staff and Student portals. The structure itself is resolved on the server
 * (shared/academic/academicStructure.js) and delivered as institution.academicStructure by
 * /auth/me — this file only reads it, so no portal carries its own school/college rules.
 *
 * Before /auth/me resolves (or for a response without it) labels fall back to neutral
 * generic terms and every level reads as enabled, so nothing flashes hidden while loading.
 */

const NEUTRAL_LABELS = {
  faculty: 'Faculty / School',
  department: 'Department',
  program: 'Program',
  course: 'Course / Class',
  batch: 'Batch',
  semester: 'Semester / Term',
  section: 'Section',
  subject: 'Subject',
  academicYear: 'Academic Year',
  classTeacher: 'Class Teacher',
  teacher: 'Teacher',
};

export const createAcademicHelpers = (structure) => {
  const labels = { ...NEUTRAL_LABELS, ...(structure?.labels || {}) };
  return {
    structure: structure || null,
    type: structure?.type || null,
    labels,
    /** Display name for a level/term key, e.g. label('course') -> "Standard" for a school. */
    label: (key) => labels[key] || key,
    /** Whether a hierarchy level is in use. Fail-open until the structure has loaded. */
    isLevelEnabled: (level) => (structure ? Boolean(structure.levels?.[level]) : true),
    regulations: structure?.regulations || null,
    hierarchy: structure?.hierarchy || [],
  };
};
