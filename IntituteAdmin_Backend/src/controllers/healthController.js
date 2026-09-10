/**
 * Institute Admin — Student Health Records Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getHealthRecords = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const records = await prisma.healthRecord.findMany({
      where: { institutionId: req.institutionId, ...(studentId && { studentId }) },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true, rollNumber: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { visitDate: 'desc' },
    });
    return sendSuccess(res, records, 'Health records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createHealthRecord = async (req, res, next) => {
  try {
    const { studentId, visitDate, symptoms, diagnosis, actionTaken, referredToHospital, parentNotified } = req.body;
    if (!studentId) throw new ValidationError('studentId is required');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found');

    const record = await prisma.healthRecord.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        actionTaken: actionTaken || null,
        referredToHospital: !!referredToHospital,
        parentNotified: !!parentNotified,
        recordedById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, record, 'Health record logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateHealthRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, actionTaken, referredToHospital, parentNotified } = req.body;

    const existing = await prisma.healthRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Health record not found');

    const record = await prisma.healthRecord.update({
      where: { id },
      data: {
        ...(diagnosis !== undefined && { diagnosis }),
        ...(actionTaken !== undefined && { actionTaken }),
        ...(referredToHospital !== undefined && { referredToHospital: !!referredToHospital }),
        ...(parentNotified !== undefined && { parentNotified: !!parentNotified }),
      },
    });
    return sendSuccess(res, record, 'Health record updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteHealthRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.healthRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Health record not found');
    await prisma.healthRecord.delete({ where: { id } });
    return sendSuccess(res, null, 'Health record deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord };
