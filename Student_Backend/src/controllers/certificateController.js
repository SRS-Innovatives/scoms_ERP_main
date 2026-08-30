/**
 * Student — Issued Certificates & Documents Controller (read-only)
 *
 * Certificates are issued by the Institute Admin (bonafide, TC, conduct, completion,
 * fee-paid, etc.) — a student can only view what has actually been issued to them.
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

const VALID_TYPES = ['BONAFIDE', 'TRANSFER', 'CONDUCT', 'COURSE_COMPLETION'];

const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, certificates, 'Certificates retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getMyCertificateRequests = async (req, res, next) => {
  try {
    const requests = await prisma.certificateRequest.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, requests, 'Certificate requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const requestCertificate = async (req, res, next) => {
  try {
    const { type, reason } = req.body;
    if (!type || !VALID_TYPES.includes(type)) throw new ValidationError(`type must be one of ${VALID_TYPES.join(', ')}`);

    const request = await prisma.certificateRequest.create({
      data: { studentId: req.user.studentId, type, reason },
    });

    return sendSuccess(res, request, 'Certificate request submitted to Admin office', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyCertificates, getMyCertificateRequests, requestCertificate };
