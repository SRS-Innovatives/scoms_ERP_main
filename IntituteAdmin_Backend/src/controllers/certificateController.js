/**
 * Institute Admin Certificate Controller
 *
 * Certificate is the institution-wide issuance ledger (one row per printed certificate,
 * with an auto-generated certificateNo) — covers Bonafide, Transfer (TC), Conduct,
 * Course Completion, and Fee-Paid certificates for students. Staff Service/Experience
 * certificates are handled by staffController (no persistence — printed on demand).
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  generateCertificateNumber,
} = require('../../../shared');

const TYPE_TITLES = {
  BONAFIDE: 'Bonafide Certificate',
  TC: 'Transfer & Conduct Certificate',
  CONDUCT: 'Conduct Certificate',
  COMPLETION: 'Course Completion Certificate',
  FEEPAID: 'Fee Paid Certificate',
};

/** CertificateRequest.type (student-facing) → Certificate.type (issuance ledger) */
const REQUEST_TYPE_TO_CERT_TYPE = {
  BONAFIDE: 'BONAFIDE',
  TRANSFER: 'TC',
  CONDUCT: 'CONDUCT',
  COURSE_COMPLETION: 'COMPLETION',
};

const getCertificates = async (req, res, next) => {
  try {
    const { type } = req.query;
    const certificates = await prisma.certificate.findMany({
      where: { institutionId: req.institutionId, ...(type && { type }) },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, registerNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, certificates, 'Certificates retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Core issuance logic shared by the direct "generate" endpoint and request-approval flow. */
const issueCertificate = async ({ institutionId, studentId, type, details }) => {
  if (!TYPE_TITLES[type]) throw new ValidationError(`type must be one of ${Object.keys(TYPE_TITLES).join(', ')}`);

  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId },
    include: {
      course: { select: { name: true } },
      section: { select: { name: true, semester: { select: { name: true, academicYear: { select: { yearName: true } } } } } },
      parents: { include: { parent: true } },
    },
  });
  if (!student) throw new NotFoundError('Student not found or access denied');

  const count = await prisma.certificate.count({ where: { institutionId } });
  const certificateNo = generateCertificateNumber(type, count + 1);

  const certificate = await prisma.certificate.create({
    data: {
      institutionId,
      studentId,
      type,
      certificateNo,
      title: TYPE_TITLES[type],
      issuedToName: `${student.firstName} ${student.lastName}`,
      details: details || undefined,
    },
  });

  const father = student.parents?.find((p) => p.relation === 'FATHER')?.parent || student.parents?.[0]?.parent;

  const certData = {
    name: `${student.firstName} ${student.lastName}`,
    rollNo: student.rollNumber || '—',
    regNo: student.registerNumber || student.admissionNumber,
    fatherName: father?.fatherName || '—',
    course: student.course?.name || '—',
    academicYear: student.section?.semester?.academicYear?.yearName || '—',
    yearSem: student.section?.semester?.name || '—',
    issueDate: new Date().toISOString().split('T')[0],
    tcNo: certificate.certificateNo,
    conduct: details?.conduct || 'GOOD',
    dob: student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—',
    dateOfAdmission: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : '—',
    dateOfLeaving: details?.dateOfLeaving || '—',
    reasonForLeaving: details?.reasonForLeaving || '—',
  };

  return { certificate, certData };
};

/** Generates a certificate for a student, persists it to the issuance ledger, and returns
 * a fully-assembled printable payload (matching CertificateTemplate's `certData` shape). */
const generateCertificate = async (req, res, next) => {
  try {
    const { studentId, type, details } = req.body; // details: { conduct, dateOfLeaving, reasonForLeaving, ... } — optional, per-type
    if (!studentId || !type) throw new ValidationError('studentId and type are required');

    const result = await issueCertificate({ institutionId: req.institutionId, studentId, type, details });
    return sendSuccess(res, result, 'Certificate generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** Student-submitted certificate requests awaiting Admin review. */
const getCertificateRequests = async (req, res, next) => {
  try {
    const requests = await prisma.certificateRequest.findMany({
      where: { student: { institutionId: req.institutionId } },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, admissionNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, requests, 'Certificate requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Approve (actually issues a real Certificate) or reject a student's request. */
const resolveCertificateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // APPROVE | REJECT
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new ValidationError('decision must be APPROVE or REJECT');

    const request = await prisma.certificateRequest.findFirst({
      where: { id, student: { institutionId: req.institutionId } },
    });
    if (!request) throw new NotFoundError('Certificate request not found or access denied');
    if (request.status !== 'PENDING') throw new ValidationError('This request has already been resolved');

    if (decision === 'REJECT') {
      const updated = await prisma.certificateRequest.update({ where: { id }, data: { status: 'REJECTED' } });
      return sendSuccess(res, updated, 'Certificate request rejected');
    }

    const certType = REQUEST_TYPE_TO_CERT_TYPE[request.type];
    const { certificate } = await issueCertificate({ institutionId: req.institutionId, studentId: request.studentId, type: certType, details: { reason: request.reason } });

    const updated = await prisma.certificateRequest.update({
      where: { id },
      data: { status: 'READY', certificateNo: certificate.certificateNo, issuedAt: new Date() },
    });

    return sendSuccess(res, { request: updated, certificate }, 'Certificate approved and issued');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCertificates,
  generateCertificate,
  getCertificateRequests,
  resolveCertificateRequest,
};
