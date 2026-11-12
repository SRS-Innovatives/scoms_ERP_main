/**
 * Institution Type -> Academic Structure (shared/academic/academicStructure.js)
 *
 * Locks in the defaults each institution type gets, how saved overrides merge on top,
 * and that normalizeAcademicConfig() rejects bad input and drops rules a type can't use.
 * Pure unit test — no database.
 */
const assert = require('assert');
const {
  INSTITUTION_TYPES,
  resolveAcademicStructure,
  normalizeAcademicConfig,
  isLevelEnabled,
  getAcademicStructureCatalog,
} = require('../shared/academic/academicStructure');

let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failures++;
    console.error(`❌ ${name}\n   ${err.message}`);
  }
};
const throwsValidation = (fn) => assert.throws(fn, (err) => err.name === 'ValidationError' || err.statusCode === 400);

console.log('🧪 Academic structure per institution type...\n');

test('SCHOOL defaults: Standard/Term, no program/batch/faculty', () => {
  const s = resolveAcademicStructure('SCHOOL', null);
  assert.strictEqual(s.labels.course, 'Standard');
  assert.strictEqual(s.labels.semester, 'Term');
  assert.deepStrictEqual(s.hierarchy, ['department', 'course', 'semester', 'section', 'subject']);
  assert.strictEqual(s.regulationsConfigurable, false);
  assert.strictEqual(s.regulations.examAuthority, 'BOARD');
});

test('COLLEGE defaults: program + batch, fixed regulations from affiliating university', () => {
  const s = resolveAcademicStructure('COLLEGE', null);
  assert.deepStrictEqual(s.hierarchy, ['department', 'program', 'course', 'batch', 'semester', 'section', 'subject']);
  assert.strictEqual(s.labels.semester, 'Semester');
  assert.strictEqual(s.regulationsConfigurable, false);
  assert.strictEqual(s.regulations.examAuthority, 'AFFILIATING_UNIVERSITY');
});

test('AUTONOMOUS_COLLEGE defaults: configurable regulations, institution is exam authority', () => {
  const s = resolveAcademicStructure('AUTONOMOUS_COLLEGE', null);
  assert.strictEqual(s.regulationsConfigurable, true);
  assert.strictEqual(s.regulations.examAuthority, 'INSTITUTION');
  assert.strictEqual(isLevelEnabled(s, 'faculty'), false);
});

test('UNIVERSITY defaults: faculty level on, full hierarchy', () => {
  const s = resolveAcademicStructure('UNIVERSITY', null);
  assert.strictEqual(isLevelEnabled(s, 'faculty'), true);
  assert.strictEqual(s.hierarchy[0], 'faculty');
  assert.strictEqual(s.labels.faculty, 'Faculty / School');
});

test('Unknown/legacy type and junk config fall back to safe defaults (never throws)', () => {
  const s = resolveAcademicStructure('NOT_A_TYPE', 'garbage');
  assert.strictEqual(s.type, 'SCHOOL');
  const t = resolveAcademicStructure('COLLEGE', { levels: { program: 'yes' }, periodType: 'DECADE', labels: { course: 42 } });
  assert.strictEqual(t.levels.program, true);
  assert.strictEqual(t.periodType, 'SEMESTER');
  assert.strictEqual(t.labels.course, 'Course');
});

test('Saved overrides merge on top of defaults', () => {
  const s = resolveAcademicStructure('SCHOOL', { levels: { batch: true }, periodType: 'YEAR', labels: { course: 'Grade' } });
  assert.strictEqual(s.levels.batch, true);
  assert.strictEqual(s.labels.semester, 'Year');
  assert.strictEqual(s.labels.course, 'Grade');
  assert.ok(s.hierarchy.includes('batch'));
});

test('Explicit semester label beats the period-type label', () => {
  const s = resolveAcademicStructure('COLLEGE', { periodType: 'YEAR', labels: { semester: 'Academic Year Part' } });
  assert.strictEqual(s.labels.semester, 'Academic Year Part');
});

test('normalize: null/empty config stays null (pure defaults)', () => {
  assert.strictEqual(normalizeAcademicConfig('COLLEGE', null), null);
  assert.strictEqual(normalizeAcademicConfig('COLLEGE', {}), null);
  assert.strictEqual(normalizeAcademicConfig('COLLEGE', { levels: { program: true }, labels: { course: '  ' } }), null);
});

test('normalize: stores only values that differ from the type defaults', () => {
  const c = normalizeAcademicConfig('SCHOOL', { levels: { program: false, batch: true }, periodType: 'TERM', labels: { course: ' Grade ' } });
  assert.deepStrictEqual(c, { levels: { batch: true }, labels: { course: 'Grade' } });
});

test('normalize: regulations dropped for non-configurable types, kept for configurable', () => {
  const regs = { regulations: { gradingScheme: 'GRADES', internalAssessmentWeight: 30 } };
  assert.strictEqual(normalizeAcademicConfig('COLLEGE', regs), null);
  assert.strictEqual(normalizeAcademicConfig('SCHOOL', regs), null);
  assert.deepStrictEqual(normalizeAcademicConfig('UNIVERSITY', regs), { regulations: { gradingScheme: 'GRADES', internalAssessmentWeight: 30 } });
});

test('normalize: rejects invalid type and values', () => {
  throwsValidation(() => normalizeAcademicConfig('KINDERGARTEN', {}));
  throwsValidation(() => normalizeAcademicConfig('COLLEGE', []));
  throwsValidation(() => normalizeAcademicConfig('COLLEGE', { levels: { program: 'yes' } }));
  throwsValidation(() => normalizeAcademicConfig('COLLEGE', { periodType: 'DECADE' }));
  throwsValidation(() => normalizeAcademicConfig('COLLEGE', { labels: { course: 'x'.repeat(41) } }));
  throwsValidation(() => normalizeAcademicConfig('UNIVERSITY', { regulations: { internalAssessmentWeight: 150 } }));
  throwsValidation(() => normalizeAcademicConfig('UNIVERSITY', { regulations: { gradingScheme: 'STARS' } }));
  throwsValidation(() => normalizeAcademicConfig('AUTONOMOUS_COLLEGE', { regulations: { creditsEnabled: 'on' } }));
});

test('normalize: always-on levels cannot be switched off', () => {
  const c = normalizeAcademicConfig('COLLEGE', { levels: { department: false, section: false } });
  assert.strictEqual(c, null);
  const s = resolveAcademicStructure('COLLEGE', { levels: { section: false } });
  assert.strictEqual(s.levels.section, true);
});

test('catalog covers all 4 types with option lists', () => {
  const cat = getAcademicStructureCatalog();
  assert.deepStrictEqual(Object.keys(cat.types), INSTITUTION_TYPES);
  assert.ok(cat.periodTypes.length && cat.gradingSchemes.length && cat.examAuthorities.length);
});

if (failures) {
  console.error(`\n❌ FAIL: ${failures} academic structure check(s) failed.`);
  process.exit(1);
}
console.log('\n🎉 Academic structure resolves and validates correctly for every institution type.');
