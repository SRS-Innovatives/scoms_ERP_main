/**
 * Shared grade-scale resolution — used by both the Institute Admin and Staff exam
 * controllers so the grading curve (and the fallback used before an institution
 * configures its own GradeScale) can never drift between the two.
 */
const prisma = require('../database/client');

// Sensible default curve — used only when the institution hasn't configured a real
// GradeScale yet (Institute Admin → Examination → Grade Setup). Once they do, every
// grade/SGPA/CGPA computed downstream uses their real, editable scale instead.
const DEFAULT_GRADE_CURVE = [
  { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10 },
  { grade: 'A', minPercentage: 75, maxPercentage: 89.99, gradePoint: 9 },
  { grade: 'B', minPercentage: 60, maxPercentage: 74.99, gradePoint: 7 },
  { grade: 'C', minPercentage: 45, maxPercentage: 59.99, gradePoint: 5 },
  { grade: 'D', minPercentage: 35, maxPercentage: 44.99, gradePoint: 4 },
  { grade: 'F', minPercentage: 0, maxPercentage: 34.99, gradePoint: 0 },
];

const getGradeScale = async (institutionId) => {
  const real = await prisma.gradeScale.findMany({ where: { institutionId } });
  return real.length > 0 ? real : DEFAULT_GRADE_CURVE;
};

const resolveGrade = (scale, marksObtained, maxMarks) => {
  const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
  const match = scale.find((g) => pct >= g.minPercentage && pct <= g.maxPercentage);
  return match ? match.grade : null;
};

const gradePointFor = (scale, grade) => scale.find((g) => g.grade === grade)?.gradePoint ?? null;

// Kept for any caller still expecting the old signature — now backed by the default curve.
const computeGrade = (marksObtained, maxMarks) => resolveGrade(DEFAULT_GRADE_CURVE, marksObtained, maxMarks);

module.exports = { DEFAULT_GRADE_CURVE, getGradeScale, resolveGrade, gradePointFor, computeGrade };
