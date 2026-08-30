/**
 * Student — Grievance Controller
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

const getMyGrievances = async (req, res, next) => {
  try {
    const grievances = await prisma.grievance.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, grievances, 'Grievances retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const submitGrievance = async (req, res, next) => {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) throw new ValidationError('subject and description are required');

    const grievance = await prisma.grievance.create({
      data: { institutionId: req.institutionId, studentId: req.user.studentId, subject, description },
    });

    return sendSuccess(res, grievance, 'Confidential grievance logged to Student Cell', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyGrievances, submitGrievance };
