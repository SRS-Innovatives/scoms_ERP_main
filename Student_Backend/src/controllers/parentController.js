/**
 * Parent — Child Directory
 *
 * The one endpoint that's genuinely parent-only: every other route in this backend is
 * shared with Student and simply resolves to whichever child is active (see
 * shared/middleware/resolveActiveChild.js). This one lists the real children linked to
 * this parent account, so the frontend can render a child switcher for a parent with
 * more than one child at the institution.
 */
const { prisma, sendSuccess, ValidationError, ROLES } = require('../../../shared');

const getMyChildren = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.PARENT) throw new ValidationError('This endpoint is for parent accounts only');

    const links = await prisma.parentStudent.findMany({
      where: { parentId: req.user.parentId },
      select: {
        relation: true,
        student: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true,
            course: { select: { name: true } }, section: { select: { name: true } },
          },
        },
      },
    });

    const children = links.map((l) => ({ ...l.student, relation: l.relation }));
    return sendSuccess(res, children, 'Children retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyChildren };
