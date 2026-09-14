/**
 * Institute Admin — Grade Scale (SGPA/CGPA point system) Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

// Used only as a one-time bootstrap an admin can seed for real via POST /grade-scale/seed-default
// — never used to fabricate a grade/GPA on its own; if an institution has no GradeScale rows,
// downstream grade/GPA computation is skipped rather than guessing.
const DEFAULT_SCALE = [
  { grade: 'O', minPercentage: 91, maxPercentage: 100, gradePoint: 10, description: 'Outstanding' },
  { grade: 'A+', minPercentage: 81, maxPercentage: 90.99, gradePoint: 9, description: 'Excellent' },
  { grade: 'A', minPercentage: 71, maxPercentage: 80.99, gradePoint: 8, description: 'Very Good' },
  { grade: 'B+', minPercentage: 61, maxPercentage: 70.99, gradePoint: 7, description: 'Good' },
  { grade: 'B', minPercentage: 50, maxPercentage: 60.99, gradePoint: 6, description: 'Average / Pass' },
  { grade: 'F', minPercentage: 0, maxPercentage: 49.99, gradePoint: 0, description: 'Re-appear / Fail' },
];

const getGradeScale = async (req, res, next) => {
  try {
    const scale = await prisma.gradeScale.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { minPercentage: 'desc' },
    });
    return sendSuccess(res, scale, 'Grade scale retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const seedDefaultScale = async (req, res, next) => {
  try {
    const existing = await prisma.gradeScale.count({ where: { institutionId: req.institutionId } });
    if (existing > 0) throw new ValidationError('A grade scale already exists — delete existing entries first if you want to reset');

    await prisma.gradeScale.createMany({
      data: DEFAULT_SCALE.map((g) => ({ ...g, institutionId: req.institutionId })),
    });
    const scale = await prisma.gradeScale.findMany({ where: { institutionId: req.institutionId }, orderBy: { minPercentage: 'desc' } });
    return sendSuccess(res, scale, 'Default grade scale created — edit any row to customize it', 201);
  } catch (err) {
    next(err);
  }
};

const createGrade = async (req, res, next) => {
  try {
    const { grade, minPercentage, maxPercentage, gradePoint, description } = req.body;
    if (!grade || minPercentage === undefined || maxPercentage === undefined || gradePoint === undefined) {
      throw new ValidationError('grade, minPercentage, maxPercentage and gradePoint are required');
    }
    if (Number(minPercentage) > Number(maxPercentage)) throw new ValidationError('minPercentage cannot exceed maxPercentage');

    const created = await prisma.gradeScale.create({
      data: {
        institutionId: req.institutionId,
        grade,
        minPercentage: Number(minPercentage),
        maxPercentage: Number(maxPercentage),
        gradePoint: Number(gradePoint),
        description: description || null,
      },
    });
    return sendSuccess(res, created, 'Grade added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateGrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { grade, minPercentage, maxPercentage, gradePoint, description } = req.body;

    const existing = await prisma.gradeScale.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Grade not found');
    if (minPercentage !== undefined && maxPercentage !== undefined && Number(minPercentage) > Number(maxPercentage)) {
      throw new ValidationError('minPercentage cannot exceed maxPercentage');
    }

    const updated = await prisma.gradeScale.update({
      where: { id },
      data: {
        ...(grade !== undefined && { grade }),
        ...(minPercentage !== undefined && { minPercentage: Number(minPercentage) }),
        ...(maxPercentage !== undefined && { maxPercentage: Number(maxPercentage) }),
        ...(gradePoint !== undefined && { gradePoint: Number(gradePoint) }),
        ...(description !== undefined && { description }),
      },
    });
    return sendSuccess(res, updated, 'Grade updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteGrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.gradeScale.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Grade not found');
    await prisma.gradeScale.delete({ where: { id } });
    return sendSuccess(res, null, 'Grade deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getGradeScale, seedDefaultScale, createGrade, updateGrade, deleteGrade };
