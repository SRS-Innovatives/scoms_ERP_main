/**
 * Student — Clubs & Societies Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getClubs = async (req, res, next) => {
  try {
    const clubs = await prisma.club.findMany({
      where: { institutionId: req.institutionId },
      include: {
        members: { where: { studentId: req.user.studentId } },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    const withMembership = clubs.map((c) => ({ ...c, isMember: c.members.length > 0, members: undefined }));
    return sendSuccess(res, withMembership, 'Clubs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const joinClub = async (req, res, next) => {
  try {
    const { clubId } = req.body;
    if (!clubId) throw new ValidationError('clubId is required');

    const club = await prisma.club.findFirst({ where: { id: clubId, institutionId: req.institutionId } });
    if (!club) throw new NotFoundError('Club not found');

    const existing = await prisma.clubMember.findUnique({
      where: { clubId_studentId: { clubId, studentId: req.user.studentId } },
    });
    if (existing) return sendSuccess(res, existing, 'Already a member of this club');

    const membership = await prisma.clubMember.create({
      data: { clubId, studentId: req.user.studentId },
    });

    return sendSuccess(res, membership, `Joined ${club.name}`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getClubs, joinClub };
