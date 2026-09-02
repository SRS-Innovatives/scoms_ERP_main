/**
 * Institute Admin — Clubs & Societies Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

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

const createClub = async (req, res, next) => {
  try {
    const { name, description, inchargeName } = req.body;
    if (!name) throw new ValidationError('name is required');

    const club = await prisma.club.create({
      data: { institutionId: req.institutionId, name, description, inchargeName },
    });

    return sendSuccess(res, club, 'Club created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteClub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.club.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Club not found');

    await prisma.club.delete({ where: { id } });
    return sendSuccess(res, null, 'Club removed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getClubs, createClub, deleteClub };
