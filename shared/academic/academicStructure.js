/**
 * Institution Type -> Academic Structure — the single source of truth every portal uses.
 *
 * Every institution type maps onto the SAME academic tables
 * (Faculty? -> Department -> Program? -> Course -> Batch? -> Semester -> Section, with
 * Subjects mapped to Courses/Sections). What differs per type is which optional levels
 * are in use, what each level is called (a school's Course is a "Standard", its Semester
 * a "Term"), and — for self-governing institutions — the academic regulations.
 *
 * Institution.academicConfig stores ONLY an institution's overrides of its type's defaults
 * (null = pure defaults), so existing institutions keep behaving exactly as before and
 * changing type never loses data. Always read it through resolveAcademicStructure();
 * always write it through normalizeAcademicConfig().
 */

const { ValidationError } = require('../errors/customErrors');

const INSTITUTION_TYPES = ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'];

/** Hierarchy order, top to bottom. Levels not in OPTIONAL_LEVELS are always on. */
const LEVEL_ORDER = ['faculty', 'department', 'program', 'course', 'batch', 'semester', 'section', 'subject'];
const OPTIONAL_LEVELS = ['faculty', 'program', 'batch'];

/** Extra terms used across portals that aren't hierarchy levels themselves. */
const LABEL_KEYS = [...LEVEL_ORDER, 'academicYear', 'classTeacher', 'teacher'];

const PERIOD_TYPES = ['TERM', 'SEMESTER', 'TRIMESTER', 'YEAR'];
const PERIOD_LABELS = { TERM: 'Term', SEMESTER: 'Semester', TRIMESTER: 'Trimester', YEAR: 'Year' };
const GRADING_SCHEMES = ['MARKS', 'GRADES', 'CGPA'];
const EXAM_AUTHORITIES = ['BOARD', 'AFFILIATING_UNIVERSITY', 'INSTITUTION'];

const MAX_LABEL_LENGTH = 40;
const MAX_NOTES_LENGTH = 2000;

const COMMON_LABELS = {
  faculty: 'Faculty / School',
  department: 'Department',
  program: 'Program',
  course: 'Course',
  batch: 'Batch',
  section: 'Section',
  subject: 'Subject',
  academicYear: 'Academic Year',
};

const TYPE_DEFAULTS = {
  SCHOOL: {
    levels: { faculty: false, program: false, batch: false },
    periodType: 'TERM',
    labels: { ...COMMON_LABELS, department: 'Wing / Department', course: 'Standard', classTeacher: 'Class Teacher', teacher: 'Teacher' },
    regulationsConfigurable: false,
    regulations: { creditsEnabled: false, gradingScheme: 'MARKS', internalAssessmentEnabled: false, internalAssessmentWeight: 0, examAuthority: 'BOARD', notes: '' },
  },
  COLLEGE: {
    levels: { faculty: false, program: true, batch: true },
    periodType: 'SEMESTER',
    labels: { ...COMMON_LABELS, classTeacher: 'Class Advisor', teacher: 'Faculty' },
    regulationsConfigurable: false, // follows the affiliating university's regulations
    regulations: { creditsEnabled: true, gradingScheme: 'CGPA', internalAssessmentEnabled: true, internalAssessmentWeight: 25, examAuthority: 'AFFILIATING_UNIVERSITY', notes: '' },
  },
  AUTONOMOUS_COLLEGE: {
    levels: { faculty: false, program: true, batch: true },
    periodType: 'SEMESTER',
    labels: { ...COMMON_LABELS, classTeacher: 'Class Advisor', teacher: 'Faculty' },
    regulationsConfigurable: true,
    regulations: { creditsEnabled: true, gradingScheme: 'CGPA', internalAssessmentEnabled: true, internalAssessmentWeight: 40, examAuthority: 'INSTITUTION', notes: '' },
  },
  UNIVERSITY: {
    levels: { faculty: true, program: true, batch: true },
    periodType: 'SEMESTER',
    labels: { ...COMMON_LABELS, classTeacher: 'Class Advisor', teacher: 'Faculty' },
    regulationsConfigurable: true,
    regulations: { creditsEnabled: true, gradingScheme: 'CGPA', internalAssessmentEnabled: true, internalAssessmentWeight: 40, examAuthority: 'INSTITUTION', notes: '' },
  },
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const assertInstitutionType = (type) => {
  if (!INSTITUTION_TYPES.includes(type)) {
    throw new ValidationError(`Institution type must be one of ${INSTITUTION_TYPES.join(', ')}`);
  }
};

/**
 * Validates and cleans an academicConfig for a given type before it is saved. Unknown keys
 * are dropped; invalid values throw. Regulation overrides are kept only for types whose
 * regulations are configurable — so switching e.g. UNIVERSITY -> COLLEGE quietly drops
 * them instead of storing rules the institution can't actually use. Returns null when
 * nothing differs from the type's defaults.
 */
const normalizeAcademicConfig = (type, input) => {
  assertInstitutionType(type);
  if (input === null || input === undefined) return null;
  if (!isPlainObject(input)) throw new ValidationError('academicConfig must be an object');

  const defaults = TYPE_DEFAULTS[type];
  const out = {};

  if (input.levels !== undefined) {
    if (!isPlainObject(input.levels)) throw new ValidationError('academicConfig.levels must be an object');
    const levels = {};
    for (const key of OPTIONAL_LEVELS) {
      if (input.levels[key] === undefined) continue;
      if (typeof input.levels[key] !== 'boolean') throw new ValidationError(`academicConfig.levels.${key} must be true or false`);
      if (input.levels[key] !== defaults.levels[key]) levels[key] = input.levels[key];
    }
    if (Object.keys(levels).length) out.levels = levels;
  }

  if (input.periodType !== undefined && input.periodType !== null && input.periodType !== '') {
    if (!PERIOD_TYPES.includes(input.periodType)) throw new ValidationError(`periodType must be one of ${PERIOD_TYPES.join(', ')}`);
    if (input.periodType !== defaults.periodType) out.periodType = input.periodType;
  }

  if (input.labels !== undefined) {
    if (!isPlainObject(input.labels)) throw new ValidationError('academicConfig.labels must be an object');
    const labels = {};
    for (const key of LABEL_KEYS) {
      const raw = input.labels[key];
      if (raw === undefined || raw === null) continue;
      if (typeof raw !== 'string') throw new ValidationError(`Label "${key}" must be text`);
      const value = raw.trim();
      if (!value) continue; // blank = use the default
      if (value.length > MAX_LABEL_LENGTH) throw new ValidationError(`Label "${key}" must be at most ${MAX_LABEL_LENGTH} characters`);
      labels[key] = value;
    }
    if (Object.keys(labels).length) out.labels = labels;
  }

  if (input.regulations !== undefined && defaults.regulationsConfigurable) {
    if (!isPlainObject(input.regulations)) throw new ValidationError('academicConfig.regulations must be an object');
    const r = input.regulations;
    const regulations = {};
    for (const key of ['creditsEnabled', 'internalAssessmentEnabled']) {
      if (r[key] === undefined) continue;
      if (typeof r[key] !== 'boolean') throw new ValidationError(`regulations.${key} must be true or false`);
      regulations[key] = r[key];
    }
    if (r.gradingScheme !== undefined) {
      if (!GRADING_SCHEMES.includes(r.gradingScheme)) throw new ValidationError(`gradingScheme must be one of ${GRADING_SCHEMES.join(', ')}`);
      regulations.gradingScheme = r.gradingScheme;
    }
    if (r.examAuthority !== undefined) {
      if (!EXAM_AUTHORITIES.includes(r.examAuthority)) throw new ValidationError(`examAuthority must be one of ${EXAM_AUTHORITIES.join(', ')}`);
      regulations.examAuthority = r.examAuthority;
    }
    if (r.internalAssessmentWeight !== undefined && r.internalAssessmentWeight !== '') {
      const w = Number(r.internalAssessmentWeight);
      if (!Number.isInteger(w) || w < 0 || w > 100) throw new ValidationError('internalAssessmentWeight must be a whole number from 0 to 100');
      regulations.internalAssessmentWeight = w;
    }
    if (r.notes !== undefined && r.notes !== null) {
      if (typeof r.notes !== 'string') throw new ValidationError('regulations.notes must be text');
      if (r.notes.length > MAX_NOTES_LENGTH) throw new ValidationError(`regulations.notes must be at most ${MAX_NOTES_LENGTH} characters`);
      regulations.notes = r.notes.trim();
    }
    const changed = Object.fromEntries(Object.entries(regulations).filter(([k, v]) => v !== defaults.regulations[k]));
    if (Object.keys(changed).length) out.regulations = changed;
  }

  return Object.keys(out).length ? out : null;
};

/**
 * The effective structure for an institution: its type's defaults merged with its saved
 * overrides. Tolerant of bad/legacy stored data (falls back to defaults rather than
 * throwing) because every portal's /auth/me depends on it.
 */
const resolveAcademicStructure = (type, savedConfig) => {
  const resolvedType = INSTITUTION_TYPES.includes(type) ? type : 'SCHOOL';
  const defaults = TYPE_DEFAULTS[resolvedType];
  const saved = isPlainObject(savedConfig) ? savedConfig : {};

  const optional = { ...defaults.levels };
  if (isPlainObject(saved.levels)) {
    for (const key of OPTIONAL_LEVELS) {
      if (typeof saved.levels[key] === 'boolean') optional[key] = saved.levels[key];
    }
  }
  const levels = Object.fromEntries(LEVEL_ORDER.map((key) => [key, OPTIONAL_LEVELS.includes(key) ? optional[key] : true]));

  const periodType = PERIOD_TYPES.includes(saved.periodType) ? saved.periodType : defaults.periodType;

  const labels = { ...defaults.labels, semester: PERIOD_LABELS[periodType] };
  if (isPlainObject(saved.labels)) {
    for (const key of LABEL_KEYS) {
      if (typeof saved.labels[key] === 'string' && saved.labels[key].trim()) labels[key] = saved.labels[key].trim();
    }
  }

  const regulations = { ...defaults.regulations };
  if (defaults.regulationsConfigurable && isPlainObject(saved.regulations)) {
    for (const key of Object.keys(regulations)) {
      if (saved.regulations[key] !== undefined) regulations[key] = saved.regulations[key];
    }
  }

  return {
    type: resolvedType,
    periodType,
    levels,
    hierarchy: LEVEL_ORDER.filter((key) => levels[key]),
    labels,
    regulationsConfigurable: defaults.regulationsConfigurable,
    regulations,
  };
};

const isLevelEnabled = (structure, level) => Boolean(structure?.levels?.[level]);

/** Defaults for every type plus the allowed option values — what the Super Admin
 * onboarding/edit forms render from, so they never hard-code their own copy. */
const getAcademicStructureCatalog = () => ({
  types: Object.fromEntries(INSTITUTION_TYPES.map((t) => [t, resolveAcademicStructure(t, null)])),
  levelOrder: LEVEL_ORDER,
  optionalLevels: OPTIONAL_LEVELS,
  labelKeys: LABEL_KEYS,
  periodTypes: PERIOD_TYPES.map((value) => ({ value, label: PERIOD_LABELS[value] })),
  gradingSchemes: GRADING_SCHEMES,
  examAuthorities: EXAM_AUTHORITIES,
});

module.exports = {
  INSTITUTION_TYPES,
  LEVEL_ORDER,
  OPTIONAL_LEVELS,
  LABEL_KEYS,
  PERIOD_TYPES,
  GRADING_SCHEMES,
  EXAM_AUTHORITIES,
  assertInstitutionType,
  normalizeAcademicConfig,
  resolveAcademicStructure,
  isLevelEnabled,
  getAcademicStructureCatalog,
};
