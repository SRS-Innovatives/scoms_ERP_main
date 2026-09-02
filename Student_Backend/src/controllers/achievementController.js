/**
 * Student — Achievements Portfolio Controller
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

const VALID_CATEGORIES = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'TECHNICAL', 'OTHER'];

const getMyAchievements = async (req, res, next) => {
  try {
    const achievements = await prisma.studentAchievement.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { awardedDate: 'desc' },
    });
    return sendSuccess(res, achievements, 'Achievements retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const addAchievement = async (req, res, next) => {
  try {
    const { title, description, category, awardedDate } = req.body;
    if (!title || !awardedDate) throw new ValidationError('title and awardedDate are required');
    if (category && !VALID_CATEGORIES.includes(category)) throw new ValidationError(`category must be one of ${VALID_CATEGORIES.join(', ')}`);

    const achievement = await prisma.studentAchievement.create({
      data: {
        institutionId: req.institutionId,
        studentId: req.user.studentId,
        title,
        description,
        category: category || 'OTHER',
        awardedDate: new Date(awardedDate),
      },
    });

    return sendSuccess(res, achievement, 'Achievement added to your portfolio', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyAchievements, addAchievement };
