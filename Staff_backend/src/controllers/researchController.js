/**
 * Staff Research & Publications Controller — a faculty member's own record of papers,
 * patents, conference talks and book chapters. University-specific in practice (gated
 * behind the 'research' module), but any institution that turns the module on can use it.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const PUBLICATION_TYPES = ['JOURNAL', 'CONFERENCE', 'PATENT', 'BOOK_CHAPTER'];

/** This staff member's own publications, newest first. */
const getMyPublications = async (req, res, next) => {
  try {
    const publications = await prisma.researchPublication.findMany({
      where: { staffId: req.user.staffId },
      orderBy: { publicationDate: 'desc' },
    });
    return sendSuccess(res, publications, 'Publications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createPublication = async (req, res, next) => {
  try {
    const { title, publicationType, journalName, publicationDate, doiOrLink, coAuthors, description } = req.body;
    if (!title || !publicationDate) throw new ValidationError('title and publicationDate are required');
    if (publicationType && !PUBLICATION_TYPES.includes(publicationType)) {
      throw new ValidationError(`publicationType must be one of: ${PUBLICATION_TYPES.join(', ')}`);
    }

    const publication = await prisma.researchPublication.create({
      data: {
        institutionId: req.institutionId,
        staffId: req.user.staffId,
        title,
        publicationType: publicationType || 'JOURNAL',
        journalName,
        publicationDate: new Date(publicationDate),
        doiOrLink,
        coAuthors,
        description,
      },
    });
    return sendSuccess(res, publication, 'Publication added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updatePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.researchPublication.findFirst({ where: { id, staffId: req.user.staffId } });
    if (!existing) throw new NotFoundError('Publication not found or access denied');

    const { title, publicationType, journalName, publicationDate, doiOrLink, coAuthors, description } = req.body;
    if (publicationType && !PUBLICATION_TYPES.includes(publicationType)) {
      throw new ValidationError(`publicationType must be one of: ${PUBLICATION_TYPES.join(', ')}`);
    }

    const publication = await prisma.researchPublication.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(publicationType !== undefined && { publicationType }),
        ...(journalName !== undefined && { journalName }),
        ...(publicationDate !== undefined && { publicationDate: new Date(publicationDate) }),
        ...(doiOrLink !== undefined && { doiOrLink }),
        ...(coAuthors !== undefined && { coAuthors }),
        ...(description !== undefined && { description }),
      },
    });
    return sendSuccess(res, publication, 'Publication updated successfully');
  } catch (err) {
    next(err);
  }
};

const deletePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.researchPublication.findFirst({ where: { id, staffId: req.user.staffId } });
    if (!existing) throw new NotFoundError('Publication not found or access denied');

    await prisma.researchPublication.delete({ where: { id } });
    return sendSuccess(res, null, 'Publication deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPublications,
  createPublication,
  updatePublication,
  deletePublication,
};
