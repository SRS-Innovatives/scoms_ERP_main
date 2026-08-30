/**
 * Staff — Student Achievement / Event Certificate Entry Controller
 *
 * A staff member may only log an achievement for a student in a section they actually teach.
 */
const { prisma, sendSuccess, ValidationError, BusinessRuleError } = require('../../../shared');

const VALID_CATEGORIES = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'TECHNICAL', 'OTHER'];

const getMySectionIds = async (staffId) => {
  const mappings = await prisma.subjectTeacherMapping.findMany({
    where: { staffId, sectionId: { not: null } },
    select: { sectionId: true },
    distinct: ['sectionId'],
  });
  return mappings.map((m) => m.sectionId);
};

/** Achievements logged for students in this staff member's own sections, most recent first. */
const getAchievements = async (req, res, next) => {
  try {
    const sectionIds = await getMySectionIds(req.user.staffId);
    if (sectionIds.length === 0) return sendSuccess(res, [], 'No assigned classes yet');

    const achievements = await prisma.studentAchievement.findMany({
      where: { institutionId: req.institutionId, student: { sectionId: { in: sectionIds } } },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } } },
      orderBy: { awardedDate: 'desc' },
    });

    return sendSuccess(res, achievements, 'Achievements retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAchievement = async (req, res, next) => {
  try {
    const { studentId, title, description, category, awardedDate } = req.body;
    if (!studentId || !title || !awardedDate) throw new ValidationError('studentId, title and awardedDate are required');
    if (category && !VALID_CATEGORIES.includes(category)) throw new ValidationError(`category must be one of ${VALID_CATEGORIES.join(', ')}`);

    const sectionIds = await getMySectionIds(req.user.staffId);
    const student = await prisma.student.findFirst({ where: { id: studentId, sectionId: { in: sectionIds } } });
    if (!student) throw new BusinessRuleError('You may only log achievements for students in your own assigned classes');

    const achievement = await prisma.studentAchievement.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        title,
        description,
        category: category || 'OTHER',
        awardedDate: new Date(awardedDate),
      },
    });

    return sendSuccess(res, achievement, 'Certificate / achievement recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAchievements, createAchievement };
