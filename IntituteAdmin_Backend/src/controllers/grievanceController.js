/**
 * Institute Admin — Grievance Resolution Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED'];

const getGrievances = async (req, res, next) => {
  try {
    const grievances = await prisma.grievance.findMany({
      where: { institutionId: req.institutionId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, admissionNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, grievances, 'Grievances retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    if (status && !VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const existing = await prisma.grievance.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Grievance not found');

    const grievance = await prisma.grievance.update({
      where: { id },
      data: { ...(status && { status }), ...(resolution !== undefined && { resolution }) },
    });

    return sendSuccess(res, grievance, 'Grievance updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getGrievances, updateGrievance };
