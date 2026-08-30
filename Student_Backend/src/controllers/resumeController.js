/**
 * Student — Resume Builder Controller
 */
const { prisma, sendSuccess } = require('../../../shared');

const getMyResume = async (req, res, next) => {
  try {
    const resume = await prisma.studentResume.findUnique({ where: { studentId: req.user.studentId } });
    return sendSuccess(res, resume || { summary: '', skills: [], projects: [] }, 'Resume retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateMyResume = async (req, res, next) => {
  try {
    const { summary, skills, projects } = req.body;

    const resume = await prisma.studentResume.upsert({
      where: { studentId: req.user.studentId },
      create: { studentId: req.user.studentId, summary, skills, projects },
      update: { summary, skills, projects },
    });

    return sendSuccess(res, resume, 'Resume saved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyResume, updateMyResume };
