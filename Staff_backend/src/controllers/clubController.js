/**
 * Staff — Clubs & Societies Controller (read-only view of the institution's clubs)
 */
const { prisma, sendSuccess } = require('../../../shared');

const getClubs = async (req, res, next) => {
  try {
    const clubs = await prisma.club.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, clubs, 'Clubs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getClubs };
