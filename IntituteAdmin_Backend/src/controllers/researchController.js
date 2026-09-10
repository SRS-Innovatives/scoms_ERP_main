/**
 * Institute Admin Research & Publications Oversight — read-only, institution-wide view
 * of every publication faculty have recorded on their own side (Staff portal owns the
 * actual create/edit/delete since a publication belongs to the author, not the admin).
 */
const { prisma, sendSuccess } = require('../../../shared');

const getInstitutionResearch = async (req, res, next) => {
  try {
    const { staffId, publicationType } = req.query;
    const publications = await prisma.researchPublication.findMany({
      where: {
        institutionId: req.institutionId,
        ...(staffId && { staffId }),
        ...(publicationType && { publicationType }),
      },
      include: {
        staff: { select: { firstName: true, lastName: true, designation: true, department: { select: { name: true } } } },
      },
      orderBy: { publicationDate: 'desc' },
    });
    return sendSuccess(res, publications, 'Institution research records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getInstitutionResearch };
