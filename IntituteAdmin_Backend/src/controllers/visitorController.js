/**
 * Institute Admin — Visitor / Gate Management Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getVisitorLogs = async (req, res, next) => {
  try {
    const { active } = req.query; // active=true -> visitors currently on campus (no checkout yet)
    const logs = await prisma.visitorLog.findMany({
      where: {
        institutionId: req.institutionId,
        ...(active === 'true' && { checkOutTime: null }),
      },
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { checkInTime: 'desc' },
    });
    return sendSuccess(res, logs, 'Visitor logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createVisitorLog = async (req, res, next) => {
  try {
    const { visitorName, phone, purpose, whomToMeet, idProofType, idProofNumber } = req.body;
    if (!visitorName || !purpose) throw new ValidationError('visitorName and purpose are required');

    const log = await prisma.visitorLog.create({
      data: {
        institutionId: req.institutionId,
        visitorName,
        phone: phone || null,
        purpose,
        whomToMeet: whomToMeet || null,
        idProofType: idProofType || null,
        idProofNumber: idProofNumber || null,
        recordedById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, log, 'Visitor checked in successfully', 201);
  } catch (err) {
    next(err);
  }
};

const checkOutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.visitorLog.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Visitor log not found');
    if (existing.checkOutTime) throw new ValidationError('This visitor has already checked out');

    const log = await prisma.visitorLog.update({ where: { id }, data: { checkOutTime: new Date() } });
    return sendSuccess(res, log, 'Visitor checked out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getVisitorLogs, createVisitorLog, checkOutVisitor };
