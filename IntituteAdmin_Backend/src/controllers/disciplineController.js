/**
 * Institute Admin — Student Discipline Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_CATEGORIES = ['MINOR', 'MAJOR', 'SEVERE'];
const VALID_STATUSES = ['OPEN', 'RESOLVED'];

const getDisciplineRecords = async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const records = await prisma.disciplineRecord.findMany({
      where: { institutionId: req.institutionId, ...(studentId && { studentId }), ...(status && { status }) },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true, rollNumber: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { incidentDate: 'desc' },
    });
    return sendSuccess(res, records, 'Discipline records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createDisciplineRecord = async (req, res, next) => {
  try {
    const { studentId, incidentDate, category, description, actionTaken } = req.body;
    if (!studentId || !description) throw new ValidationError('studentId and description are required');
    if (category && !VALID_CATEGORIES.includes(category)) throw new ValidationError(`category must be one of ${VALID_CATEGORIES.join(', ')}`);

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found');

    const record = await prisma.disciplineRecord.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
        category: category || 'MINOR',
        description,
        actionTaken: actionTaken || null,
        reportedById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, record, 'Discipline record logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateDisciplineRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, actionTaken } = req.body;
    if (status && !VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const existing = await prisma.disciplineRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Discipline record not found');

    const record = await prisma.disciplineRecord.update({
      where: { id },
      data: { ...(status && { status }), ...(actionTaken !== undefined && { actionTaken }) },
    });
    return sendSuccess(res, record, 'Discipline record updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteDisciplineRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.disciplineRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Discipline record not found');
    await prisma.disciplineRecord.delete({ where: { id } });
    return sendSuccess(res, null, 'Discipline record deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDisciplineRecords, createDisciplineRecord, updateDisciplineRecord, deleteDisciplineRecord };
