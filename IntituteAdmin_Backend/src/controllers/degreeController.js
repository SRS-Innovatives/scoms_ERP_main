/**
 * Institute Admin Convocation & Degree Issuance Controller — real CRUD over the formal
 * degree a University (or an autonomous College) confers, distinct from the Certificates
 * module's TC/bonafide/conduct paperwork every institution type issues.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, pushNotification } = require('../../../shared');

const getDegrees = async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const degrees = await prisma.degreeRecord.findMany({
      where: {
        institutionId: req.institutionId,
        ...(studentId && { studentId }),
        ...(status && { status }),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true, course: { select: { name: true } } } },
        issuingInstitution: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, degrees, 'Degree records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createDegree = async (req, res, next) => {
  try {
    const { studentId, degreeName, convocationDate } = req.body;
    if (!studentId || !degreeName) throw new ValidationError('studentId and degreeName are required');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    // A plain (non-autonomous) College's degree is legally conferred by its affiliating
    // University, not the college itself — default the issuing authority to that link when
    // one is on file. A University or Autonomous College always issues its own.
    const self = await prisma.institution.findUnique({
      where: { id: req.institutionId },
      select: { type: true, affiliatedUniversityId: true },
    });
    const issuingInstitutionId = self.type === 'COLLEGE' ? self.affiliatedUniversityId || null : null;

    const degree = await prisma.degreeRecord.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        degreeName,
        convocationDate: convocationDate ? new Date(convocationDate) : null,
        issuingInstitutionId,
      },
      include: { issuingInstitution: { select: { id: true, name: true } } },
    });
    return sendSuccess(res, degree, 'Degree record created successfully', 201);
  } catch (err) {
    if (err.code === 'P2002') return next(new ValidationError('This student already has a degree record with that name'));
    next(err);
  }
};

/** Issue a pending degree — assigns the registry number and issued date, and notifies
 * the student. Distinct step from creation since a degree is often created ahead of the
 * actual convocation and only "issued" once it's real. */
const issueDegree = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { degreeNumber, issuedDate } = req.body;

    const existing = await prisma.degreeRecord.findFirst({
      where: { id, institutionId: req.institutionId },
      include: {
        student: { select: { userId: true, firstName: true, lastName: true } },
        issuingInstitution: { select: { name: true } },
      },
    });
    if (!existing) throw new NotFoundError('Degree record not found');
    if (existing.status === 'ISSUED') throw new ValidationError('This degree has already been issued');

    const degree = await prisma.degreeRecord.update({
      where: { id },
      data: {
        status: 'ISSUED',
        degreeNumber: degreeNumber || existing.degreeNumber,
        issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
      },
      include: { issuingInstitution: { select: { id: true, name: true } } },
    });

    if (existing.student?.userId) {
      pushNotification({
        userId: existing.student.userId,
        institutionId: req.institutionId,
        title: 'Degree Issued',
        message: `Your ${existing.degreeName} has been issued${existing.issuingInstitution ? ` by ${existing.issuingInstitution.name}` : ''}. Registry No: ${degree.degreeNumber || 'pending'}.`,
        type: 'CONVOCATION',
        link: '/student/degree',
      }).catch(() => {});
    }

    return sendSuccess(res, degree, 'Degree issued successfully');
  } catch (err) {
    next(err);
  }
};

const revokeDegree = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.degreeRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Degree record not found');

    const degree = await prisma.degreeRecord.update({ where: { id }, data: { status: 'REVOKED' } });
    return sendSuccess(res, degree, 'Degree revoked');
  } catch (err) {
    next(err);
  }
};

const deleteDegree = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.degreeRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Degree record not found');

    await prisma.degreeRecord.delete({ where: { id } });
    return sendSuccess(res, null, 'Degree record deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDegrees,
  createDegree,
  issueDegree,
  revokeDegree,
  deleteDegree,
};
