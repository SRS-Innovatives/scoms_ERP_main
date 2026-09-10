/**
 * University Affiliation Oversight — only meaningful for a UNIVERSITY-type institution:
 * the real list of Colleges/Autonomous Colleges that named this university as their
 * affiliatedUniversityId at onboarding (Super Admin sets this link, not the university
 * itself — mirrors how a real university doesn't self-affiliate colleges on a whim).
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

const getAffiliatedColleges = async (req, res, next) => {
  try {
    const self = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { type: true } });
    if (!self || self.type !== 'UNIVERSITY') {
      throw new ValidationError('Only a University institution has affiliated colleges to manage');
    }

    const colleges = await prisma.institution.findMany({
      where: { affiliatedUniversityId: req.institutionId },
      select: {
        id: true, name: true, code: true, type: true, city: true, state: true, status: true, createdAt: true,
        _count: { select: { students: true, staff: true } },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, colleges, 'Affiliated colleges retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAffiliatedColleges };
