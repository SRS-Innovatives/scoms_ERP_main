/**
 * Student — Leave / Absence Requests Controller
 */
const { prisma, sendSuccess, ValidationError, getActiveList } = require('../../../shared');

/** The leave types this institution actually offers right now — its own customized
 * list if it has one, the standard default otherwise. Powers the Apply Leave dropdown. */
const getLeaveTypes = async (req, res, next) => {
  try {
    const types = await getActiveList(req.institutionId, 'LEAVE_TYPE');
    return sendSuccess(res, types, 'Leave types retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, leaves, 'Leave requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) throw new ValidationError('startDate, endDate and reason are required');

    const leave = await prisma.leaveRequest.create({
      data: {
        institutionId: req.institutionId,
        studentId: req.user.studentId,
        type: type || 'CASUAL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    });

    return sendSuccess(res, leave, 'Leave request submitted for approval', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyLeaves, applyLeave, getLeaveTypes };
